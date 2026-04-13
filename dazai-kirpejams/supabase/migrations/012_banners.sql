-- ============================================
-- BANNERS — hero ir kampanijų baneriai
-- ============================================

create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),

  -- Pozicija: 'hero' = pagrindinis puslapis, 'category' = kategorijos puslapis
  placement text not null default 'hero',

  -- Multi-lang turinys
  title_lt text not null,
  title_en text not null,
  title_ru text not null,
  subtitle_lt text,
  subtitle_en text,
  subtitle_ru text,

  -- Badge (mažas tekstas virš antraštės, pvz. "Color SHOCK · Nauja")
  badge_lt text,
  badge_en text,
  badge_ru text,

  -- CTA mygtukai
  cta_text_lt text,
  cta_text_en text,
  cta_text_ru text,
  cta_url text,

  cta_secondary_text_lt text,
  cta_secondary_text_en text,
  cta_secondary_text_ru text,
  cta_secondary_url text,

  -- Vizualas
  image_url text,
  background_color text,

  -- Rikiavimas ir aktyvumas
  sort_order integer default 0,
  is_active boolean default true,

  -- Laikotarpio planavimas
  starts_at timestamptz,
  ends_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_banners_active on banners(is_active, placement, sort_order);

-- RLS
alter table banners enable row level security;

create policy "Public read active banners" on banners
  for select using (is_active = true);

-- Admin full access (naudoja is_admin() iš 004_admin_access.sql)
create policy "Admin full access banners" on banners
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Seed default hero banner
INSERT INTO banners (placement, title_lt, title_en, title_ru, subtitle_lt, subtitle_en, subtitle_ru, badge_lt, badge_en, badge_ru, cta_text_lt, cta_text_en, cta_text_ru, cta_url, cta_secondary_text_lt, cta_secondary_text_en, cta_secondary_text_ru, cta_secondary_url, sort_order, is_active)
VALUES (
  'hero',
  'Profesionalūs plaukų dažai kirpėjams',
  'Professional hair dyes for hairdressers',
  'Профессиональные краски для парикмахеров',
  'Didesnė 180 ml talpa. Daugiau vertės darbui salone. Profesionali formulė, plati spalvų paletė ir ekonomiška kaina — viskas, ko reikia Jūsų salonui.',
  'Bigger 180 ml volume. More value for your salon work. Professional formula, wide color palette and competitive price — everything your salon needs.',
  'Увеличенный объём 180 мл. Больше пользы для работы в салоне. Профессиональная формула, широкая палитра и экономичная цена.',
  'Color SHOCK · Pasirinkimas iš 50+ spalvų',
  'Color SHOCK · Choose from 50+ colors',
  'Color SHOCK · Выбор из 50+ цветов',
  'Peržiūrėti produktus',
  'View products',
  'Смотреть продукты',
  '/produktai',
  'Gauti pasiūlymą salonui',
  'Get a salon offer',
  'Получить предложение для салона',
  '/salonams',
  0,
  true
);
