-- ============================================
-- 067: Savikainos/B2B slėpimas — FAZĖ 2 (breaking, taikyti PASKUTINĮ)
-- ============================================
-- Atima tiesioginę prieigą prie products lentelės nuo anon ir authenticated.
-- Po šito:
--   anon          — products visai nepasiekiama; skaito tik products_public
--                   view (be cost/b2b). queries.ts jau naudoja view.
--   authenticated — lieka TIK 066 suteikti stulpeliai (be cost/b2b); rep
--                   užklausa (konkretūs stulpeliai + įdėtinis product_prices)
--                   veikia toliau.
--   service_role  — NEpaliestas (admin + scriptai mato viską).
--
-- ⚠️ TAIKYTI TIK KAI naujas kodas (queries.ts → products_public) JAU GYVAS
--    prode. Kitaip vieša parduotuvė liks be prekių, kol nepasidiegs kodas.
--
-- Patikra po pritaikymo (su viešu anon raktu):
--   GET /rest/v1/products?select=cost_price_cents  → turi būti permission denied
--   GET /rest/v1/products_public?select=name_lt,price_cents → veikia
--
-- Atstatymas: grant select on products to anon, authenticated;
-- ============================================

revoke select on products from anon;
revoke select on products from authenticated;

notify pgrst, 'reload schema';
