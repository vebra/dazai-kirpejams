-- ============================================
-- Storage Buckets: produktų nuotraukos + blog cover'iai
-- ============================================

-- Produktų nuotraukų viešas bucket'as.
-- Public read — bet kas gali atsisiųsti paveikslėlius (reikia e-commerce).
-- Įkelimas leidžiamas tik authenticated user'iams (t.y. service role arba
-- admin iš Studio).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  10485760, -- 10 MB per failą
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Blog cover'ių viešas bucket'as
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- ============================================
-- RLS policy'ai Storage'ui
-- ============================================

-- Viešas skaitymas produktų paveikslėlių
drop policy if exists "Public read products images" on storage.objects;
create policy "Public read products images" on storage.objects
  for select
  using (bucket_id = 'products');

-- Viešas skaitymas blog cover'ių
drop policy if exists "Public read blog images" on storage.objects;
create policy "Public read blog images" on storage.objects
  for select
  using (bucket_id = 'blog');

-- Įkelimas tik authenticated user'iams (Studio / service role apeina RLS)
drop policy if exists "Authenticated upload products" on storage.objects;
create policy "Authenticated upload products" on storage.objects
  for insert
  with check (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated upload blog" on storage.objects;
create policy "Authenticated upload blog" on storage.objects
  for insert
  with check (
    bucket_id = 'blog'
    and auth.role() = 'authenticated'
  );
