import 'server-only'
import { createServerClient } from '@/lib/supabase/server'

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed'

export type CampaignRow = {
  id: string
  name: string
  subject: string
  body: string
  status: CampaignStatus
  createdAt: string
  updatedAt: string
  sentAt: string | null
  sentCount: number
  failedCount: number
  /** Skaičiuojamas: kiek patvirtintų vartotojų DB šiuo metu (nuoroda admin'ui). */
  approvedUsersCount?: number
}

export async function getCampaigns(): Promise<CampaignRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select(
      'id, name, subject, body, status, created_at, updated_at, sent_at, sent_count, failed_count'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/marketing-queries] getCampaigns:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    body: r.body,
    status: r.status as CampaignStatus,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    sentAt: r.sent_at,
    sentCount: r.sent_count,
    failedCount: r.failed_count,
  }))
}

export async function getCampaignById(
  id: string
): Promise<CampaignRow | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select(
      'id, name, subject, body, status, created_at, updated_at, sent_at, sent_count, failed_count'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    subject: data.subject,
    body: data.body,
    status: data.status as CampaignStatus,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    sentAt: data.sent_at,
    sentCount: data.sent_count,
    failedCount: data.failed_count,
  }
}

export async function getApprovedUsersCount(): Promise<number> {
  const supabase = createServerClient()
  const { count, error } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'approved')
  if (error) {
    console.error(
      '[admin/marketing-queries] getApprovedUsersCount:',
      error.message
    )
    return 0
  }
  return count ?? 0
}

export type ApprovedUserRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  salonName: string | null
  adminNotes: string | null
}

/**
 * Visi patvirtinti vartotojai su email iš auth.users + admin pastabomis.
 * Naudojama /admin/kampanijos/[id] gavėjų pasirinkimo UI'jui.
 */
export async function getApprovedUsersWithNotes(): Promise<ApprovedUserRow[]> {
  const supabase = createServerClient()

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, salon_name, admin_notes')
    .eq('verification_status', 'approved')
    .order('created_at', { ascending: false })

  if (error || !profiles) {
    console.error(
      '[admin/marketing-queries] getApprovedUsersWithNotes:',
      error?.message
    )
    return []
  }

  // Email gaunam iš auth.users per admin API (kaip ir verifikacijos UI)
  const { data: usersData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  const emailMap = new Map<string, string>()
  for (const u of usersData?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email)
  }

  return profiles
    .map((p) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? '',
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      salonName: p.salon_name ?? null,
      adminNotes: p.admin_notes ?? null,
    }))
    .filter((p) => p.email) // praleidžiam profilius be email
}

export type CampaignRecipientRow = {
  id: string
  email: string
  status: 'pending' | 'sent' | 'failed'
  sentAt: string | null
  errorMessage: string | null
  openedAt: string | null
  openedCount: number
}

export async function getCampaignRecipients(
  campaignId: string
): Promise<CampaignRecipientRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('marketing_campaign_recipients')
    .select('id, email, status, sent_at, error_message, opened_at, opened_count')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(
      '[admin/marketing-queries] getCampaignRecipients:',
      error.message
    )
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    status: r.status as 'pending' | 'sent' | 'failed',
    sentAt: r.sent_at,
    errorMessage: r.error_message,
    openedAt: r.opened_at,
    openedCount: r.opened_count ?? 0,
  }))
}
