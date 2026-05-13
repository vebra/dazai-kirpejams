-- ============================================
-- Migracija 030 — renginių Storage bucket'as
-- ============================================
--
-- Viešas bucket'as `events` — admin įkeltos renginio hero nuotraukos
-- (path: `<event_slug>/<timestamp>-<rand>.<ext>`). Naudoja tą patį
-- patterną kaip `products` bucket'as (žr. migraciją 003).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'events',
  'events',
  true,
  10485760, -- 10 MB per failą
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Viešas skaitymas — public puslapis /renginys reikalauja, kad bet kas
-- galėtų atsisiųsti renginio hero nuotrauką be login'o.
drop policy if exists "Public read events images" on storage.objects;
create policy "Public read events images" on storage.objects
  for select
  using (bucket_id = 'events');

-- Įkelimas tik authenticated user'iams (admin per service role apeina RLS).
drop policy if exists "Authenticated upload events" on storage.objects;
create policy "Authenticated upload events" on storage.objects
  for insert
  with check (
    bucket_id = 'events'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated update events" on storage.objects;
create policy "Authenticated update events" on storage.objects
  for update to authenticated
  using (bucket_id = 'events')
  with check (bucket_id = 'events');

drop policy if exists "Authenticated delete events" on storage.objects;
create policy "Authenticated delete events" on storage.objects
  for delete to authenticated
  using (bucket_id = 'events');
