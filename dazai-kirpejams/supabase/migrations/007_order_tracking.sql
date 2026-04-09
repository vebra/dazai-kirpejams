-- ============================================
-- 007: Siuntimo sekimo numeris (tracking number)
-- ============================================
-- Admin'as įveda ranka po etiketės sugeneravimo Omniva/DPD/LP Express portale.
-- Naudojamas: admin detalėje, statuso keitimo email'e klientui.

alter table orders
  add column if not exists tracking_number text,
  add column if not exists tracking_carrier text;  -- pvz. 'omniva', 'dpd', 'lp_express'
