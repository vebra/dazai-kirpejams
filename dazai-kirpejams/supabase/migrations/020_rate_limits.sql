-- ============================================
-- Rate limits: viešų formų apsauga nuo spam'o
-- ============================================
--
-- Naudojamas `kontaktai`, `salonams` ir `newsletter` server action'uose,
-- kad užkirstume kelią:
--  - masiniam Resend email kvotos degimui (salonams siunčia 2 email'us per
--    pateikimą)
--  - spam'o įrašams į `contact_messages` / `b2b_inquiries` /
--    `newsletter_subscribers` lenteles
--
-- Fixed-window skaitiklis — kiekvienas `key` (pvz. "newsletter:hash:abc...")
-- turi eilutę kiekvienam langui (window_start). Inkrementuojame atomiškai
-- per UPSERT ir grąžiname, ar dar tilpo į limitą.
--
-- IP'ai NESAUGOMI tiesiogiai — tik SHA-256 hash'as su sūdymu per
-- RATE_LIMIT_SALT env kintamąjį (žr. src/lib/rate-limit.ts). Tai paverčia
-- lentelę ne-PII.

create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

-- Indeksas senų eilučių valymui
create index if not exists rate_limits_window_start_idx
  on rate_limits (window_start);

-- ============================================
-- RPC: check_rate_limit
-- ============================================
--
-- Atomiškai inkrementuoja skaitiklį dabartiniam langui ir grąžina true, jei
-- po inkremento vis dar esam <= p_max_requests. Fixed-window (ne sliding) —
-- paprastesnis modelis, pakankamas spam prevention'ui.
--
-- Argumentai:
--   p_key             — logical bucket ('newsletter:hash:abc', 'contact:hash:abc')
--   p_window_seconds  — lango dydis sekundėmis (60 = 1 min, 3600 = 1 h)
--   p_max_requests    — kiek pateikimų leidžiama per langą
--
-- Grąžina: json { allowed: bool, count: int, retry_after_seconds: int }

create or replace function check_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max_requests int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count int;
  v_retry_after int;
begin
  -- Suapvalinam dabartinį laiką į lango pradžią (epoch modulis)
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds)::bigint * p_window_seconds
  );

  insert into rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  if v_count <= p_max_requests then
    return jsonb_build_object('allowed', true, 'count', v_count);
  end if;

  v_retry_after := greatest(
    1,
    ceil(extract(epoch from (v_window_start + (p_window_seconds || ' seconds')::interval - now())))::int
  );

  return jsonb_build_object(
    'allowed', false,
    'count', v_count,
    'retry_after_seconds', v_retry_after
  );
end;
$$;

-- Tik service-role gali kviesti. Anon klientai net negalėtų — RLS ne prie
-- reikalo, nes funkcija per `security definer` apeina RLS.
revoke all on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;

-- ============================================
-- Cleanup: senų eilučių trynimas
-- ============================================
--
-- Paprasta valymo funkcija — ištrina eilutes, kurių langas baigėsi prieš
-- 24 valandas. Ją galima kviesti periodiškai iš cron (pvz. Supabase
-- Scheduled Functions) arba rankomis.

create or replace function cleanup_rate_limits()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from rate_limits
  where window_start < now() - interval '24 hours';

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function cleanup_rate_limits() from public, anon, authenticated;
grant execute on function cleanup_rate_limits() to service_role;
