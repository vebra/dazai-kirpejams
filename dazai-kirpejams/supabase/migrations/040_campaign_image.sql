-- ============================================
-- 040: Kampanijos nuotrauka (image_url)
-- ============================================
-- Leidžia pridėti vieną nuotrauką į marketingo kampanijos laišką.
-- Nuotrauka įkeliama į 'blog' storage bucket'ą (campaigns/ kelias), o čia
-- saugomas tik viešas URL. Idempotentiška.
-- SVARBU: paleisti PRIEŠ deploy'inant naują kodą — getCampaignById ir
-- create/update veiksmai pradės skaityti/rašyti šį stulpelį.
-- ============================================

ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS image_url text;
