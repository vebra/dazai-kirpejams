-- ============================================
-- Storage bucket: PVM sąskaitos faktūros (PDF)
-- ============================================
--
-- Skirtingai nuo `products` / `blog` bucket'ų (public), sąskaitos faktūros yra
-- privatus bucket'as — apima asmens duomenis (pirkėjo vardas, adresas,
-- įmonės kodas), todėl vieša prieiga neleidžiama.
--
-- Prieiga:
--  • Admin'ai — pilna (per service role klientą server action'uose)
--  • Pirkėjas — tik per SIGNED URL (generuojamas server-side kai klientas
--    spaudžia „Parsisiųsti sąskaitą" savo paskyroje). URL galioja ribotą
--    laiką (pvz. 1 val.), todėl public RLS policy nereikia.
--
-- Failo kelias: `{YYYY}/SF-{YYYY}-{NNNN}.pdf` (pvz. `2026/SF-2026-0042.pdf`)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false, -- PRIVATE
  5242880, -- 5 MB per failą (PDF'ai nedideli)
  array['application/pdf']
)
on conflict (id) do nothing;

-- ============================================
-- RLS: privatus bucket'as — jokių public policy'ių
-- ============================================
--
-- Service role klientas (createServerClient) apeina RLS, todėl generavimas /
-- admin download'as veikia be papildomų policy'ių. Klientams signed URL
-- generuojamas server-side, Supabase signed URL autorizacija neremiasi RLS.
--
-- Jei ateityje reikės leisti authenticated user'iui pačiam list'inti savo
-- sąskaitas tiesiogiai iš Storage API — pridėsim policy su email match per
-- orders.email. Kol kas to nereikia.

-- Išvalom galimas senas policy'as (idempotent migration)
drop policy if exists "Admins read invoices" on storage.objects;
drop policy if exists "Admins upload invoices" on storage.objects;
drop policy if exists "Admins delete invoices" on storage.objects;

-- Admin'ams leidžiam pilną prieigą per Studio / authenticated sesiją
-- (service role client'as vis tiek apeina RLS; policy'ė reikalinga, jei
-- admin'as jungiasi per Studio UI).
create policy "Admins manage invoice files" on storage.objects
  for all to authenticated
  using (bucket_id = 'invoices' and is_admin())
  with check (bucket_id = 'invoices' and is_admin());
