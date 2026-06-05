-- ============================================
-- Akcijos kaina prekėms (sale_price_cents)
-- ============================================
-- Pridedam neprivalomą akcijos kainą. Jei nustatyta ir mažesnė už price_cents —
-- svetainėje rodoma kaip akcija (sena kaina perbraukta), o krepšelis/užsakymas
-- naudoja šią kainą. Tuščia (null) — akcijos nėra.
--
-- create_order_atomic pasitiki kliento `unit_price_cents`, todėl atskiro RPC
-- keisti nereikia — akcijos kaina pateka per krepšelį.

alter table products
  add column if not exists sale_price_cents int
    check (sale_price_cents is null or sale_price_cents >= 0);

comment on column products.sale_price_cents is
  'Akcijos kaina centais. Jei nustatyta ir < price_cents — rodoma kaip akcija (price_cents perbraukta). Null = nėra akcijos.';

-- PostgREST schemos perkrovimas, kad naujas stulpelis būtų matomas iškart
notify pgrst, 'reload schema';
