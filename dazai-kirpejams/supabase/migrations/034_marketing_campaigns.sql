-- ============================================
-- 034: Marketing kampanijos patvirtintiems vartotojams
-- ============================================
--
-- KODĖL: admin'as nori siųsti „relational" el. laiškus (pvz. „Ar žinote
-- kas mes esame", sezoninius pasiūlymus) tik patvirtintiems profesionalams
-- (`user_profiles.verification_status = 'approved'`). Reikia kampanijos
-- saugojimo + audit istorijos kam ir kada išsiųsta.
--
-- KAIP TAIKOMA: Supabase Dashboard SQL Editor, projektas bylzloadhsodqkhziime.

-- Kampanijos pati — admin kuria, redaguoja, paleidžia
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'failed')),
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_count integer not null default 0,
  failed_count integer not null default 0
);

create index if not exists idx_marketing_campaigns_status
  on public.marketing_campaigns(status);
create index if not exists idx_marketing_campaigns_created_at
  on public.marketing_campaigns(created_at desc);

-- Audit per gavėją — kas konkrečiai kampanijos laišką gavo, kada, ar
-- pavyko. Leidžia matyti istoriją + diagnozuoti nepavykusius siuntimus.
create table if not exists public.marketing_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_recipients_campaign
  on public.marketing_campaign_recipients(campaign_id);
create index if not exists idx_marketing_recipients_user
  on public.marketing_campaign_recipients(user_id);
create index if not exists idx_marketing_recipients_status
  on public.marketing_campaign_recipients(status);

-- RLS — tik admin'ai (per requireAdmin srautą serveryje su service-role
-- klientu). Public NĖRA prieigos: nei skaityti, nei rašyti.
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_campaign_recipients enable row level security;

drop policy if exists "Admins manage campaigns" on public.marketing_campaigns;
create policy "Admins manage campaigns" on public.marketing_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read recipients" on public.marketing_campaign_recipients;
create policy "Admins read recipients" on public.marketing_campaign_recipients
  for all using (public.is_admin()) with check (public.is_admin());

comment on table public.marketing_campaigns is
  'Marketing/relational kampanijos patvirtintiems profesionalams.
   created_by → admin_users; status: draft/sending/sent/failed.';

comment on table public.marketing_campaign_recipients is
  'Audit per gavėją: kuriam vartotojui kuri kampanija išsiųsta, ar pavyko.
   user_id → auth.users; status: pending/sent/failed.';
