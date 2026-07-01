-- ============================================
-- 077: Marketingo laiškų atsisakymas (audito radinys A8)
-- ============================================
-- Kampanijų laiškuose iki šiol nebuvo jokio atsisakymo kelio (GDPR/ePrivacy
-- reikalavimas tiesioginei rinkodarai + Gmail/Yahoo bulk-sender taisyklės
-- reikalauja List-Unsubscribe). Pridedam opt-out vėliavėlę:
--   • /api/marketing/atsisakyti endpoint'as (HMAC žetonas, be prisijungimo)
--     nustato marketing_opt_out = true
--   • kampanijų siuntimas ir gavėjų picker'is tokius vartotojus praleidžia
-- Transakciniai laiškai (užsakymo patvirtinimas, statusai) NEliečiami —
-- opt-out galioja tik marketingo kampanijoms.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table user_profiles
  add column if not exists marketing_opt_out boolean not null default false;

comment on column user_profiles.marketing_opt_out is
  'Vartotojas atsisakė marketingo kampanijų laiškų (unsubscribe nuoroda laiške). Transakciniams laiškams įtakos neturi.';

notify pgrst, 'reload schema';
