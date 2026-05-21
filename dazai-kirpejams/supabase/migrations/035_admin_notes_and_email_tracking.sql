-- ============================================
-- 035: Admin pastabos prie kliento + el. laiškų atidarymo tracking
-- ============================================
--
-- KODĖL:
-- 1. Admin'as nori per /admin/kampanijos pasirinkti konkrečius gavėjus
--    (ne visus „approved") ir prie kiekvieno turėti savo pastabą
--    (pvz. „VIP", „nenori dažnai laiškų", „skambino dėl naujo paletės").
-- 2. Reikia matyti, ar kampanijos laiškas buvo atidarytas — per 1×1
--    pixel beacon'ą (`/api/track/open/[id]`).
--
-- TAIKOMA: Supabase Dashboard SQL Editor, projektas bylzloadhsodqkhziime.

-- ============================================
-- 1) user_profiles.admin_notes
-- ============================================
-- Naudojamas admin'o vidiniam komentarui. Klientas šito niekur nemato.
alter table public.user_profiles
  add column if not exists admin_notes text;

comment on column public.user_profiles.admin_notes is $$Admin vidiniai užrašai apie klientą (VIP, kontekstas, asmeninės pastabos). Klientas šito niekur nemato.$$;

-- ============================================
-- 2) marketing_campaign_recipients tracking
-- ============================================
-- opened_at — pirmas atidarymas (užfiksuotas per /api/track/open/[id]).
-- opened_count — kiek kartų buvo užkrautas pixel'is (gali rodyti
--   pakartotinius atidarymus, bet Gmail/Outlook proxy iškreipia, todėl
--   skaičius daugiau orientacinis nei tikslus).
alter table public.marketing_campaign_recipients
  add column if not exists opened_at timestamptz;

alter table public.marketing_campaign_recipients
  add column if not exists opened_count integer not null default 0;

comment on column public.marketing_campaign_recipients.opened_at is $$Pirmas užfiksuotas atidarymas per pixel beacon (/api/track/open/[id]). Gmail/Outlook proxy paveikslus iškart, tad reikšmė reiškia „pristatyta į inbox", ne tikrą atidarymą.$$;

comment on column public.marketing_campaign_recipients.opened_count is $$Pixel beacon load skaičius. Orientacinis, ne tikslus dėl email klientų cache.$$;

-- Indeksas — kad galėtume greitai filtruoti atidarytus per admin UI.
create index if not exists idx_marketing_recipients_opened_at
  on public.marketing_campaign_recipients(opened_at);
