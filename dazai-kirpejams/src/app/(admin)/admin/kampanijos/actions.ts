'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import { buildCampaignEmail } from '@/lib/email/campaign-template'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
  'https://www.dazaikirpejams.lt'

// Tarp siuntimų — kad nesusidurtume su Resend rate-limit (10/sec free).
const SEND_DELAY_MS = 250

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function createCampaignAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const name = ((formData.get('name') as string) ?? '').trim()
  const subject = ((formData.get('subject') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!name || !subject || !body) {
    redirect('/admin/kampanijos/nauja?error=missing-fields')
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      name,
      subject,
      body,
      status: 'draft',
      created_by: admin.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[admin/kampanijos] createCampaign:', error?.message)
    redirect('/admin/kampanijos/nauja?error=create-failed')
  }

  revalidatePath('/admin/kampanijos')
  redirect(`/admin/kampanijos/${data.id}?created=1`)
}

export async function updateCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = ((formData.get('id') as string) ?? '').trim()
  const name = ((formData.get('name') as string) ?? '').trim()
  const subject = ((formData.get('subject') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!id || !name || !subject || !body) {
    redirect(`/admin/kampanijos/${id}?error=missing-fields`)
  }

  const supabase = createServerClient()
  // Saugumas: redaguoti galima tik draft būsenos kampaniją.
  const { data: current } = await supabase
    .from('marketing_campaigns')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!current) redirect('/admin/kampanijos?error=not-found')
  if (current.status !== 'draft') {
    redirect(`/admin/kampanijos/${id}?error=cannot-edit-sent`)
  }

  const { error } = await supabase
    .from('marketing_campaigns')
    .update({
      name,
      subject,
      body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/kampanijos] updateCampaign:', error.message)
    redirect(`/admin/kampanijos/${id}?error=update-failed`)
  }

  revalidatePath('/admin/kampanijos')
  revalidatePath(`/admin/kampanijos/${id}`)
  redirect(`/admin/kampanijos/${id}?saved=1`)
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/kampanijos?error=invalid-id')

  const supabase = createServerClient()
  // Trinti galima tik draft kampanijas — išsiųsti laiškai turi audit istoriją.
  const { data: current } = await supabase
    .from('marketing_campaigns')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (current?.status !== 'draft') {
    redirect(`/admin/kampanijos/${id}?error=cannot-delete-sent`)
  }

  const { error } = await supabase
    .from('marketing_campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/kampanijos] deleteCampaign:', error.message)
    redirect(`/admin/kampanijos/${id}?error=delete-failed`)
  }

  revalidatePath('/admin/kampanijos')
  redirect('/admin/kampanijos?deleted=1')
}

/**
 * Siunčia testinę kopiją tik į admin notification email'ą, kad pamatytumėt
 * kaip atrodo prieš tikrąją kampaniją. Pakartotinis paspaudimas — be limito.
 */
export async function sendTestCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/kampanijos?error=invalid-id')

  const supabase = createServerClient()
  const { data: campaign } = await supabase
    .from('marketing_campaigns')
    .select('id, subject, body')
    .eq('id', id)
    .maybeSingle()

  if (!campaign) redirect('/admin/kampanijos?error=not-found')

  const testEmail = getAdminNotificationEmail()
  if (!testEmail) {
    redirect(`/admin/kampanijos/${id}?error=no-admin-email`)
  }

  try {
    const payload = buildCampaignEmail({
      subject: `[TESTAS] ${campaign.subject}`,
      body: campaign.body,
      firstName: 'admin',
      siteUrl: SITE_URL,
    })
    await sendEmail({
      to: testEmail,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })
  } catch (err) {
    console.error('[admin/kampanijos] sendTest failed:', err)
    redirect(`/admin/kampanijos/${id}?error=test-failed`)
  }

  redirect(`/admin/kampanijos/${id}?test-sent=1`)
}

/**
 * Atnaujina admin pastabą prie konkretaus vartotojo profilio. Naudojama
 * /admin/kampanijos/[id] gavėjų pasirinkimo UI'jui (inline notes editor).
 */
export async function updateUserAdminNotesAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const userId = (formData.get('user_id') as string) ?? ''
  const notes = ((formData.get('admin_notes') as string) ?? '').trim()
  const campaignId = (formData.get('campaign_id') as string) ?? ''

  if (!userId) {
    redirect(`/admin/kampanijos/${campaignId}?error=invalid-user`)
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('user_profiles')
    .update({ admin_notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[admin/kampanijos] updateAdminNotes:', error.message)
    redirect(`/admin/kampanijos/${campaignId}?error=notes-failed`)
  }

  revalidatePath(`/admin/kampanijos/${campaignId}`)
  redirect(`/admin/kampanijos/${campaignId}?notes-saved=1`)
}

/**
 * Pagrindinis siuntimas — kampanijos laišką gauna pasirinkti gavėjai
 * (formData.getAll('recipient_id')). Jei sąrašas tuščias, fallback'inam
 * į visus patvirtintus (atgalinis suderinamumas).
 *
 * Per gavėją insert'inama eilutė į `marketing_campaign_recipients` su
 * rezultatu (sent / failed). Open tracking — per `/api/track/open/[id]`
 * pixel beacon'ą, įterptą į laiško HTML.
 */
export async function sendCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/kampanijos?error=invalid-id')

  const selectedRecipientIds = formData.getAll('recipient_id').filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  )

  const supabase = createServerClient()
  const { data: campaign } = await supabase
    .from('marketing_campaigns')
    .select('id, subject, body, status')
    .eq('id', id)
    .maybeSingle()

  if (!campaign) redirect('/admin/kampanijos?error=not-found')

  if (campaign.status !== 'draft') {
    // Idempotencija — pakartotinai siųsti negalima.
    redirect(`/admin/kampanijos/${id}?error=already-sent`)
  }

  // 1) Pažymim sending iškart, kad UI neleistų antrą kartą spustelėti
  await supabase
    .from('marketing_campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id)

  // 2) Surenkam patvirtintus vartotojus (arba pasirinktą poaibį) + email
  let profilesQuery = supabase
    .from('user_profiles')
    .select('id, first_name')
    .eq('verification_status', 'approved')

  if (selectedRecipientIds.length > 0) {
    profilesQuery = profilesQuery.in('id', selectedRecipientIds)
  }
  const { data: profiles } = await profilesQuery

  const profileById = new Map<string, { firstName: string | null }>()
  for (const p of profiles ?? []) {
    profileById.set(p.id, { firstName: p.first_name })
  }

  const { data: usersResp } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const recipients: { userId: string; email: string; firstName: string | null }[] = []
  for (const u of usersResp?.users ?? []) {
    if (!u.email) continue
    const profile = profileById.get(u.id)
    if (!profile) continue // tik approved (+ pasirinkti, jei selectedRecipientIds.length > 0)
    recipients.push({
      userId: u.id,
      email: u.email,
      firstName: profile.firstName,
    })
  }

  if (recipients.length === 0) {
    await supabase
      .from('marketing_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: 0,
        failed_count: 0,
      })
      .eq('id', id)
    redirect(`/admin/kampanijos/${id}?sent=1&total=0`)
  }

  // 3) Per recipient: insert pending eilutę, siųsk laišką, update status
  let sentCount = 0
  let failedCount = 0

  for (const r of recipients) {
    const { data: recRow } = await supabase
      .from('marketing_campaign_recipients')
      .insert({
        campaign_id: id,
        user_id: r.userId,
        email: r.email,
        status: 'pending',
      })
      .select('id')
      .single()

    try {
      const payload = buildCampaignEmail({
        subject: campaign.subject,
        body: campaign.body,
        firstName: r.firstName,
        siteUrl: SITE_URL,
        // Tracking pixel — per recipient eilutės UUID. Atidarius laišką
        // (arba Gmail/Outlook proxy iškart) endpoint'as fiksuos opened_at.
        trackingPixelUrl: recRow
          ? `${SITE_URL}/api/track/open/${recRow.id}`
          : null,
      })
      await sendEmail({
        to: r.email,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      })
      sentCount++
      if (recRow) {
        await supabase
          .from('marketing_campaign_recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', recRow.id)
      }
    } catch (err) {
      failedCount++
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[admin/kampanijos] send to ${r.email} failed:`, errMsg)
      if (recRow) {
        await supabase
          .from('marketing_campaign_recipients')
          .update({ status: 'failed', error_message: errMsg.slice(0, 500) })
          .eq('id', recRow.id)
      }
    }

    // Rate-limit apsauga (Resend free ~10/sec)
    await sleep(SEND_DELAY_MS)
  }

  // 4) Galutinis statusas
  await supabase
    .from('marketing_campaigns')
    .update({
      status: failedCount > 0 && sentCount === 0 ? 'failed' : 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/admin/kampanijos')
  revalidatePath(`/admin/kampanijos/${id}`)
  redirect(
    `/admin/kampanijos/${id}?sent=1&total=${sentCount}${failedCount > 0 ? `&failed=${failedCount}` : ''}`
  )
}
