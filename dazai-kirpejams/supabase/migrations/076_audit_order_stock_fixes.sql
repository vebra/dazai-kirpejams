-- ============================================
-- 076: Audito pataisos — užsakymo prekių pridėjimas ir reaktyvavimas
-- ============================================
-- Audito radiniai A1–A4 (docs/AUDITAS-2026-07-01.md):
--   A1: add_order_item PVM skaičiavo pagal PIRKĖJO vat_code (B2C užsakymuose
--       PVM būdavo nulinamas, rep užsakymų total sumažėdavo per PVM sumą).
--       Dabar — pagal MŪSŲ įmonės PVM kodą iš shop_settings (kaip checkout'e).
--   A2: add_order_item atmeta atšauktus/grąžintus užsakymus (stock_restored) —
--       kitaip prekės nurašymas niekada nebebūtų grąžintas.
--   A3: add_order_item atmeta rep (vadybininkės) užsakymus — jų prekės
--       apskaitomos vadybininkės atsargose, centrinio sandėlio nurašymas čia
--       reikštų dvigubą/negrįžtamą nurašymą.
--   A4: naujas redecrement_stock_by_order_id — grąžinant atšauktą užsakymą į
--       aktyvų statusą sandėlis nurašomas iš naujo ir stock_restored nuresetinamas.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

-- ───────────────────────────────────────────
-- add_order_item v2 — guard'ai + PVM iš įmonės kodo
-- ───────────────────────────────────────────
create or replace function add_order_item(
  p_order_id uuid,
  p_product_id uuid,
  p_qty int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_prod products%rowtype;
  v_unit int;
  v_subtotal int;
  v_total int;
  v_vat int;
  v_vat_rate numeric;
  v_company_vat text;
  v_bal int;
begin
  if p_qty is null or p_qty <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_qty');
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  -- Rep (vadybininkės) užsakymo pildyti negalima: jo prekės nurašomos iš
  -- vadybininkės atsargų per approve_rep_order, o šis kelias nurašytų
  -- centrinį sandėlį (approve → dvigubas nurašymas; reject → negrąžinamas).
  if v_order.approval_status is not null then
    return jsonb_build_object('ok', false, 'reason', 'rep_order');
  end if;

  -- Atšaukto/grąžinto (arba jau restore'into) užsakymo pildyti negalima:
  -- stock_restored jau true, tad naujas nurašymas niekada nebebūtų
  -- grąžintas nei cancel, nei delete keliu.
  if v_order.status in ('cancelled', 'refunded')
     or coalesce(v_order.stock_restored, false) then
    return jsonb_build_object('ok', false, 'reason', 'order_terminal');
  end if;

  select * into v_prod from products where id = p_product_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'product_not_found');
  end if;
  if not v_prod.is_active then
    return jsonb_build_object('ok', false, 'reason', 'product_inactive');
  end if;
  if coalesce(v_prod.stock_quantity, 0) < p_qty then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_stock',
      'stock', coalesce(v_prod.stock_quantity, 0));
  end if;

  -- Efektyvi kaina: akcijos kaina, jei aktyvi
  if v_prod.sale_price_cents is not null
     and v_prod.sale_price_cents > 0
     and v_prod.sale_price_cents < v_prod.price_cents then
    v_unit := v_prod.sale_price_cents;
  else
    v_unit := v_prod.price_cents;
  end if;

  insert into order_items (
    order_id, product_id, product_name, product_sku,
    quantity, unit_price_cents, total_cents
  ) values (
    p_order_id, p_product_id, v_prod.name_lt, v_prod.sku,
    p_qty, v_unit, v_unit * p_qty
  );

  update products
    set stock_quantity = stock_quantity - p_qty,
        is_in_stock = (stock_quantity - p_qty) > 0,
        updated_at = now()
  where id = p_product_id
  returning stock_quantity into v_bal;

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (p_product_id, -p_qty, v_bal, 'sale', v_order.order_number);

  -- Perskaičiuojam sumas iš visų eilučių
  select coalesce(sum(total_cents), 0) into v_subtotal
  from order_items where order_id = p_order_id;

  -- PVM pagal MŪSŲ įmonės PVM kodą (shop_settings) — tas pats šaltinis kaip
  -- checkout'e (vatRateFromVatCode(companyInfo.vatCode)). NE pagal pirkėjo
  -- vat_code: B2C pirkėjas jo neturi, bet PVM sąskaitoje išskiriamas, jei
  -- pardavėjas PVM mokėtojas.
  select nullif(btrim(value #>> '{}'), '')
    into v_company_vat
  from shop_settings
  where key = 'company_vat_code';

  v_vat_rate := case when v_company_vat is not null then 0.21 else 0 end;

  v_total := v_subtotal - coalesce(v_order.discount_cents, 0)
             + coalesce(v_order.delivery_cost_cents, 0);
  if v_total < 0 then v_total := 0; end if;

  if v_vat_rate > 0 then
    v_vat := round(v_total::numeric - v_total::numeric / (1 + v_vat_rate))::int;
  else
    v_vat := 0;
  end if;

  update orders
    set subtotal_cents = v_subtotal,
        vat_cents = v_vat,
        total_cents = v_total,
        updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'ok', true,
    'subtotal_cents', v_subtotal,
    'total_cents', v_total,
    'stock', v_bal
  );
end;
$$;

grant execute on function add_order_item(uuid, uuid, int) to service_role;

-- ───────────────────────────────────────────
-- redecrement_stock_by_order_id — atšaukto užsakymo reaktyvavimas
-- ───────────────────────────────────────────
-- Veidrodinė restore_stock_by_order_id pusė: kai admin'as grąžina cancelled/
-- refunded užsakymą į aktyvų statusą, prekės nurašomos iš naujo ir
-- stock_restored nuresetinamas, kad vėlesnis cancel vėl galėtų grąžinti.
-- Nepakankamo likučio atveju NIEKO nekeičia (pre-check prieš apply).
create or replace function redecrement_stock_by_order_id(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_bal int;
  item record;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  -- Rep užsakymo prekės buvo grąžintos į VADYBININKĖS atsargas — reaktyvuoti
  -- per centrinį sandėlį negalima.
  if v_order.approval_status is not null then
    return jsonb_build_object('ok', false, 'reason', 'rep_order');
  end if;

  -- Sandėlis nebuvo grąžintas (cancel dar be restore, arba jau reaktyvuota) —
  -- nurašyti iš naujo nėra ko.
  if not coalesce(v_order.stock_restored, false) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  -- 1) Pre-check: užrakinam ir patikrinam VISAS eilutes prieš keisdami bet ką,
  -- kad nepakakus vienos prekės likučio neliktų dalinio nurašymo.
  for item in
    select oi.product_id, oi.quantity, p.stock_quantity, p.name_lt
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    for update of p
  loop
    if coalesce(item.stock_quantity, 0) < item.quantity then
      return jsonb_build_object(
        'ok', false, 'reason', 'insufficient_stock',
        'product', item.name_lt,
        'stock', coalesce(item.stock_quantity, 0),
        'needed', item.quantity
      );
    end if;
  end loop;

  -- 2) Apply: nurašom ir fiksuojam žurnale
  for item in
    select product_id, quantity from order_items where order_id = p_order_id
  loop
    update products
      set stock_quantity = stock_quantity - item.quantity,
          is_in_stock = (stock_quantity - item.quantity) > 0,
          updated_at = now()
    where id = item.product_id
    returning stock_quantity into v_bal;

    insert into stock_movements (product_id, delta, balance_after, reason, source, note)
    values (item.product_id, -item.quantity, v_bal, 'sale', v_order.order_number,
            'Reaktyvuotas atšauktas užsakymas');
  end loop;

  update orders
    set stock_restored = false, updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function redecrement_stock_by_order_id(uuid) to service_role;

notify pgrst, 'reload schema';
