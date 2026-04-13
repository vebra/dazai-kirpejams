-- ============================================
-- Nuolaidų kodų integracija į užsakymus
-- ============================================
--
-- Ši migracija užbaigia end-to-end srautą:
--   1) Prideda `discount_code` ir `discount_cents` kolonas prie `orders`
--      — kad įsimintume, koks kodas ir kiek nukirto sumą.
--   2) Sukuria `validate_discount_code` RPC'ą — read-only validacija, kurią
--      kviečia krepšelis, kai vartotojas įveda kuponą. Grąžina jsonb su
--      rezultatu (ok + discount_cents, arba ok=false + reason).
--   3) Sukuria `apply_discount_code` RPC'ą — atomiškai (FOR UPDATE lock'as)
--      patikrina ir padidina `used_count`. Kviečiamas checkout'e PRIEŠ
--      užsakymo insert'ą — jei `max_uses` viršyta, užsakymas negalimas.
--
-- Abu funkcionalumai SECURITY DEFINER, kad apeitų RLS (anoniminis vartotojas
-- gali validuoti kuponą krepšelyje, nors normaliai RLS leistų skaityti tik
-- aktyvius kodus). search_path fiksuotas.

-- ============================================
-- Naujos kolonos `orders` lentelėje
-- ============================================
alter table orders
  add column if not exists discount_code text,
  add column if not exists discount_cents int not null default 0
    check (discount_cents >= 0);

-- ============================================
-- validate_discount_code — read-only patikra
-- ============================================
-- Grąžina jsonb:
--   { ok: true,  discount_cents: 1234, code: "PAVASARIS25", discount_type: "percent", value: 25 }
--   { ok: false, reason: "not_found" | "inactive" | "expired" | "too_early" |
--                        "max_uses_reached" | "min_order_not_met" }
--
-- Visas skaičiavimas server-side — nepasitikime klientu. Jei min_order_cents
-- neįvykdyta, grąžinam papildomą `min_order_cents` reikšmę, kad UI galėtų
-- parodyti „Kupono reikia €X minimalaus užsakymo".
create or replace function validate_discount_code(
  p_code text,
  p_cart_subtotal_cents int
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code discount_codes%rowtype;
  v_normalized_code text;
  v_discount_cents int;
  v_now timestamptz := now();
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if p_cart_subtotal_cents is null or p_cart_subtotal_cents < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_cart');
  end if;

  v_normalized_code := upper(trim(p_code));

  select * into v_code
  from discount_codes
  where code = v_normalized_code;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not v_code.is_active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;

  if v_code.valid_from is not null and v_code.valid_from > v_now then
    return jsonb_build_object('ok', false, 'reason', 'too_early');
  end if;

  if v_code.valid_until is not null and v_code.valid_until < v_now then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'max_uses_reached');
  end if;

  if p_cart_subtotal_cents < v_code.min_order_cents then
    return jsonb_build_object(
      'ok', false,
      'reason', 'min_order_not_met',
      'min_order_cents', v_code.min_order_cents
    );
  end if;

  -- Skaičiuojam nuolaidą
  if v_code.discount_type = 'percent' then
    v_discount_cents := floor(p_cart_subtotal_cents * v_code.value / 100.0);
  else
    -- fixed_cents — apribotas krepšelio suma, kad nesumažintų daugiau nei turim
    v_discount_cents := least(v_code.value, p_cart_subtotal_cents);
  end if;

  -- Saugumas: nuolaida niekada negali viršyti krepšelio subtotal
  if v_discount_cents > p_cart_subtotal_cents then
    v_discount_cents := p_cart_subtotal_cents;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', v_code.code,
    'discount_type', v_code.discount_type,
    'value', v_code.value,
    'discount_cents', v_discount_cents
  );
end;
$$;

grant execute on function validate_discount_code(text, int) to authenticated;
grant execute on function validate_discount_code(text, int) to anon;

-- ============================================
-- apply_discount_code — atomiškas inkrementas
-- ============================================
-- Kviečiamas checkout'e. Iš naujo validuoja VISKA (negalima pasitikėti tuo,
-- kad klientas išsiuntė tuos pačius duomenis, kuriuos matė), pridėtinai
-- patikrina, ar max_uses dar neviršytas (FOR UPDATE lock'as apsaugo nuo
-- dviejų paraleliai siunčiamų užsakymų, kurie abu naudoja paskutinį kartą
-- galimą kodą), ir padidina used_count per vieną transakciją.
--
-- Grąžina jsonb:
--   { ok: true,  discount_cents: 1234 }
--   { ok: false, reason: "..." }
create or replace function apply_discount_code(
  p_code text,
  p_cart_subtotal_cents int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code discount_codes%rowtype;
  v_normalized_code text;
  v_discount_cents int;
  v_now timestamptz := now();
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if p_cart_subtotal_cents is null or p_cart_subtotal_cents < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_cart');
  end if;

  v_normalized_code := upper(trim(p_code));

  -- FOR UPDATE lock'ina kodą, kol finišuos transakcija — kitos paraleliai
  -- vykstančios `apply_discount_code` su tuo pačiu kodu lauks
  select * into v_code
  from discount_codes
  where code = v_normalized_code
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not v_code.is_active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;

  if v_code.valid_from is not null and v_code.valid_from > v_now then
    return jsonb_build_object('ok', false, 'reason', 'too_early');
  end if;

  if v_code.valid_until is not null and v_code.valid_until < v_now then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'max_uses_reached');
  end if;

  if p_cart_subtotal_cents < v_code.min_order_cents then
    return jsonb_build_object(
      'ok', false,
      'reason', 'min_order_not_met',
      'min_order_cents', v_code.min_order_cents
    );
  end if;

  if v_code.discount_type = 'percent' then
    v_discount_cents := floor(p_cart_subtotal_cents * v_code.value / 100.0);
  else
    v_discount_cents := least(v_code.value, p_cart_subtotal_cents);
  end if;

  if v_discount_cents > p_cart_subtotal_cents then
    v_discount_cents := p_cart_subtotal_cents;
  end if;

  -- Inkrementuojam used_count — atomiškai, nes turim lock'ą
  update discount_codes
  set used_count = used_count + 1,
      updated_at = now()
  where id = v_code.id;

  return jsonb_build_object(
    'ok', true,
    'code', v_code.code,
    'discount_cents', v_discount_cents
  );
end;
$$;

grant execute on function apply_discount_code(text, int) to authenticated;
grant execute on function apply_discount_code(text, int) to anon;

-- ============================================
-- Kompensacinis rollback — sumažina used_count
-- ============================================
-- Kviečiamas jei užsakymo insert'as nepavyko PO to, kai jau iškvietėme
-- apply_discount_code. Be šito kodas „prarastų" vieną panaudojimą.
create or replace function revert_discount_code(
  p_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized_code text;
begin
  if p_code is null or trim(p_code) = '' then
    return;
  end if;
  v_normalized_code := upper(trim(p_code));

  update discount_codes
  set used_count = greatest(used_count - 1, 0),
      updated_at = now()
  where code = v_normalized_code;
end;
$$;

grant execute on function revert_discount_code(text) to authenticated;
grant execute on function revert_discount_code(text) to anon;
