-- ============================================
-- BANNER EVENTS — banerių parodymų ir paspaudimų sekimas
-- ============================================
--
-- banner_key:
--   • banners.id (uuid tekstu) — rankiniai baneriai iš banners lentelės
--   • 'event:<slug>'           — automatinis renginio baneris (be banners eilutės)
--
-- Rašo TIK service_role per /api/banner-stats route'ą (apeina RLS).
-- Skaito adminas per banner_event_counts view (security_invoker → RLS galioja).

create table if not exists banner_events (
  id bigint generated always as identity primary key,
  banner_key text not null check (char_length(banner_key) <= 100),
  event_type text not null check (event_type in ('impression', 'click')),
  created_at timestamptz not null default now()
);

create index idx_banner_events_key on banner_events(banner_key, event_type);

alter table banner_events enable row level security;

-- Jokio public insert — įrašo tik service_role (RLS jam negalioja).
create policy "Admin read banner events" on banner_events
  for select to authenticated
  using (is_admin());

-- Agregatas admin sąrašui — vienas select vietoj N count užklausų.
create view banner_event_counts
  with (security_invoker = true) as
  select banner_key, event_type, count(*)::int as cnt
  from banner_events
  group by banner_key, event_type;

-- PostgREST schema cache atnaujinimas, kad nauja lentelė/view matytųsi per REST.
notify pgrst, 'reload schema';
