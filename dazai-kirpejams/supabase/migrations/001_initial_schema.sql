-- ============================================
-- Dažai Kirpėjams - Initial DB Schema
-- ============================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- CATEGORIES
-- ============================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name_lt text not null,
  name_en text not null,
  name_ru text not null,
  description_lt text,
  description_en text,
  description_ru text,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_categories_slug on categories(slug);
create index idx_categories_active on categories(is_active);

-- ============================================
-- BRANDS
-- ============================================
create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description_lt text,
  description_en text,
  description_ru text,
  logo_url text,
  created_at timestamptz default now()
);

-- ============================================
-- PRODUCTS
-- ============================================
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  sku text unique,
  category_id uuid references categories(id) on delete restrict,
  brand_id uuid references brands(id) on delete set null,

  -- Multi-language content
  name_lt text not null,
  name_en text not null,
  name_ru text not null,
  description_lt text,
  description_en text,
  description_ru text,
  ingredients_lt text,
  ingredients_en text,
  ingredients_ru text,
  usage_lt text,
  usage_en text,
  usage_ru text,

  -- Pricing
  price_cents int not null,              -- kaina centais (EUR)
  compare_price_cents int,                -- sena kaina (nuolaidai)
  b2b_price_cents int,                    -- B2B kaina

  -- Physical attributes
  volume_ml int,                          -- talpa ml
  weight_g int,

  -- Color attributes (plaukų dažams)
  color_number text,                      -- pvz. "6.4"
  color_name text,                        -- pvz. "Šviesiai varinė"
  color_hex text,                         -- pvz. "#C84A2B"
  color_tone text,                        -- šilta/šalta/neutrali
  color_family text,                      -- šviesi/vidutinė/tamsi

  -- Stock
  stock_quantity int default 0,
  is_in_stock boolean default true,

  -- Status
  is_active boolean default true,
  is_featured boolean default false,

  -- Media
  image_urls text[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_slug on products(slug);
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_products_featured on products(is_featured);
create index idx_products_color_tone on products(color_tone);
create index idx_products_color_family on products(color_family);

-- ============================================
-- ORDERS
-- ============================================
create type order_status as enum (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

create type payment_method as enum (
  'stripe',
  'paysera',
  'bank_transfer'
);

create type delivery_method as enum (
  'courier',
  'parcel_locker',
  'pickup'
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,

  -- Customer
  email text not null,
  phone text,
  first_name text not null,
  last_name text not null,
  company_name text,                       -- jei B2B
  company_code text,                        -- įmonės kodas
  vat_code text,                            -- PVM kodas

  -- Delivery
  delivery_method delivery_method not null,
  delivery_address text,
  delivery_city text,
  delivery_postal_code text,
  delivery_country text default 'LT',
  delivery_notes text,
  delivery_cost_cents int default 0,

  -- Payment
  payment_method payment_method not null,
  payment_status text default 'pending',
  payment_reference text,

  -- Totals
  subtotal_cents int not null,
  vat_cents int not null,
  total_cents int not null,

  -- Status
  status order_status default 'pending',

  -- Metadata
  locale text default 'lt',
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_email on orders(email);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);

-- ============================================
-- ORDER ITEMS
-- ============================================
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,

  product_name text not null,              -- snapshot at purchase time
  product_sku text,
  quantity int not null,
  unit_price_cents int not null,
  total_cents int not null,

  created_at timestamptz default now()
);

create index idx_order_items_order on order_items(order_id);

-- ============================================
-- B2B INQUIRIES
-- ============================================
create table if not exists b2b_inquiries (
  id uuid primary key default uuid_generate_v4(),

  salon_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  address text,
  monthly_volume text,                     -- apytiksliai
  message text,

  status text default 'new',                -- new, contacted, converted, closed
  locale text default 'lt',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_b2b_inquiries_status on b2b_inquiries(status);
create index idx_b2b_inquiries_created on b2b_inquiries(created_at desc);

-- ============================================
-- CONTACT MESSAGES
-- ============================================
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),

  name text not null,
  email text not null,
  phone text,
  subject text,                            -- Bendras / Užsakymas / B2B / Kita
  message text not null,

  is_read boolean default false,
  locale text default 'lt',

  created_at timestamptz default now()
);

create index idx_contact_messages_read on contact_messages(is_read);

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================
create table if not exists newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  locale text default 'lt',
  is_active boolean default true,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz
);

-- ============================================
-- BLOG POSTS
-- ============================================
create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,

  title_lt text not null,
  title_en text not null,
  title_ru text not null,
  excerpt_lt text,
  excerpt_en text,
  excerpt_ru text,
  content_lt text,
  content_en text,
  content_ru text,

  cover_image_url text,
  author text,
  category text,

  is_published boolean default false,
  published_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_blog_posts_slug on blog_posts(slug);
create index idx_blog_posts_published on blog_posts(is_published, published_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table categories enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table b2b_inquiries enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;
alter table blog_posts enable row level security;

-- Public read access for catalog
create policy "Public read categories" on categories
  for select using (is_active = true);

create policy "Public read brands" on brands
  for select using (true);

create policy "Public read products" on products
  for select using (is_active = true);

create policy "Public read published blog posts" on blog_posts
  for select using (is_published = true);

-- Public insert for forms (anonymous users can submit)
create policy "Public insert b2b inquiries" on b2b_inquiries
  for insert with check (true);

create policy "Public insert contact messages" on contact_messages
  for insert with check (true);

create policy "Public insert newsletter" on newsletter_subscribers
  for insert with check (true);
