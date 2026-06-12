-- ============================================
-- 073: Vadybininkės prekių judėjimo istorija
-- ============================================
-- „Mano atsargos" iki šiol rodė tik neto likutį (get_my_issued_stock) — pilnai
-- grąžintos ar parduotos prekės iš sąrašo dingdavo. Vadybininkė turi matyti,
-- kiek iš viso paėmė, grąžino, pardavė ir kiek liko, plius pilną judėjimų
-- žurnalą. stock_movements RLS leidžia skaityti tik adminui, todėl abi
-- funkcijos security definer su filtru rep_id = auth.uid().
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

-- ───────────────────────────────────────────
-- get_my_stock_summary — suvestinė per prekę: paimta / grąžinta / parduota / turima
-- ───────────────────────────────────────────
create or replace function get_my_stock_summary()
returns table (
  product_id uuid,
  name text,
  sku text,
  color_number text,
  taken int,
  returned int,
  sold int,
  on_hand int,
  last_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select m.product_id, p.name_lt, p.sku, p.color_number,
         sum(case when m.reason = 'issue_to_rep' then abs(m.delta) else 0 end)::int as taken,
         sum(case when m.reason = 'return_from_rep' then abs(m.delta) else 0 end)::int as returned,
         (sum(case when m.reason = 'rep_sale' then abs(m.delta) else 0 end)
          - sum(case when m.reason = 'rep_sale_cancel' then abs(m.delta) else 0 end))::int as sold,
         sum(case when m.reason in ('issue_to_rep', 'rep_sale_cancel')
                  then abs(m.delta) else -abs(m.delta) end)::int as on_hand,
         max(m.created_at) as last_at
  from stock_movements m
  join products p on p.id = m.product_id
  where m.reason in ('issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel')
    and m.rep_id = auth.uid()
  group by m.product_id, p.name_lt, p.sku, p.color_number
  order by max(m.created_at) desc;
$$;

grant execute on function get_my_stock_summary() to authenticated;

-- ───────────────────────────────────────────
-- get_my_stock_movements — pilnas judėjimų žurnalas (naujausi viršuje)
-- ───────────────────────────────────────────
create or replace function get_my_stock_movements()
returns table (
  created_at timestamptz,
  reason text,
  qty int,
  source text,
  product_id uuid,
  name text,
  sku text,
  color_number text
)
language sql
security definer
set search_path = public
stable
as $$
  select m.created_at, m.reason, abs(m.delta)::int as qty, m.source,
         m.product_id, p.name_lt, p.sku, p.color_number
  from stock_movements m
  join products p on p.id = m.product_id
  where m.reason in ('issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel')
    and m.rep_id = auth.uid()
  order by m.created_at desc
  limit 500;
$$;

grant execute on function get_my_stock_movements() to authenticated;

notify pgrst, 'reload schema';
