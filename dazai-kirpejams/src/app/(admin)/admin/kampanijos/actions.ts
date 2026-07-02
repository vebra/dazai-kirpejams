'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import { buildCampaignEmail } from '@/lib/email/campaign-template'
import { createUnsubscribeToken } from '@/lib/email/unsubscribe-token'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
  'https://www.dazaikirpejams.lt'

// Tarp siuntimų — Resend default rate-limit yra 2 req/s (ne 10/s!), tad
// 600 ms (~1.6/s) palieka atsargą. Per greitas siuntimas grąžina 429, kuris
// žurnale būtų pažymėtas 'failed'.
const SEND_DELAY_MS = 600

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// Kampanijos nuotraukos keliamos į tą patį viešą 'blog' bucket'ą (campaigns/).
const CAMPAIGN_BUCKET = 'blog'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

export type CampaignImageUploadState = {
  error?: string
  url?: string
}

export async function uploadCampaignImageAction(
  _prev: CampaignImageUploadState,
  formData: FormData
): Promise<CampaignImageUploadState> {
  await requireAdmin()

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Pasirinkite paveikslėlį.' }
  if (file.size > MAX_IMAGE_SIZE) return { error: 'Failas per didelis (max 10 MB).' }
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return { error: 'Netinkamas formatas. Leidžiama: JPG, PNG, WebP, AVIF.' }
  }

  const supabase = createServerClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(CAMPAIGN_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[admin/kampanijos] upload:', uploadError.message)
    return { error: `Nepavyko įkelti: ${uploadError.message}` }
  }

  const { data: publicData } = supabase.storage
    .from(CAMPAIGN_BUCKET)
    .getPublicUrl(path)
  return { url: publicData.publicUrl }
}

export async function createCampaignAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const name = ((formData.get('name') as string) ?? '').trim()
  const subject = ((formData.get('subject') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()
  const imageUrl = ((formData.get('image_url') as string) ?? '').trim() || null

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
      image_url: imageUrl,
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
  const imageUrl = ((formData.get('image_url') as string) ?? '').trim() || null

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
      image_url: imageUrl,
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

/**
 * Klonuoja egzistuojančią kampaniją į naują juodraštį — tas pats subject +
 * body, name su „(kopija)" priesaga. Gavėjai NEkopijuojami (admin'as
 * pasirenka iš naujo per RecipientPicker'į). Veikia su bet kokio status
 * kampanija — galima klonuoti net sent, kad galėtumėt išsiųsti tą patį
 * tekstą iš naujo kitiems gavėjams ar po pakeitimų.
 */
export async function duplicateCampaignAction(
  formData: FormData
): Promise<void> {
  const admin = await requireAdmin()
  const sourceId = (formData.get('id') as string) ?? ''
  if (!sourceId) redirect('/admin/kampanijos?error=invalid-id')

  const supabase = createServerClient()
  const { data: source } = await supabase
    .from('marketing_campaigns')
    .select('name, subject, body, image_url')
    .eq('id', sourceId)
    .maybeSingle()

  if (!source) redirect('/admin/kampanijos?error=not-found')

  const { data: newCampaign, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      name: `${source.name} (kopija)`,
      subject: source.subject,
      body: source.body,
      image_url: source.image_url,
      status: 'draft',
      created_by: admin.id,
    })
    .select('id')
    .single()

  if (error || !newCampaign) {
    console.error('[admin/kampanijos] duplicate failed:', error?.message)
    redirect('/admin/kampanijos?error=duplicate-failed')
  }

  revalidatePath('/admin/kampanijos')
  redirect(`/admin/kampanijos/${newCampaign.id}?duplicated=1`)
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/kampanijos?error=invalid-id')

  const supabase = createServerClient()
  // Vienintelis statusas, kurio negalim trinti — `sending` (vyksta siuntimas).
  // Trinant tuo metu, marketing_campaign_recipients eilutės būtų ištrintos
  // per CASCADE, bet jau išsiųsti email'ai pasiektų gavėjus be audit įrašo.
  // Draft / sent / failed — viskas saugu trinti (CASCADE išvalo audit kartu).
  const { data: current } = await supabase
    .from('marketing_campaigns')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!current) {
    redirect('/admin/kampanijos?error=not-found')
  }

  if (current.status === 'sending') {
    redirect(`/admin/kampanijos/${id}?error=cannot-delete-sending`)
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
    .select('id, subject, body, image_url')
    .eq('id', id)
    .maybeSingle()

  if (!campaign) redirect('/admin/kampanijos?error=not-found')

  const testEmail = getAdminNotificationEmail()
  if (!testEmail) {
    redirect(`/admin/kampanijos/${id}?error=no-admin-email`)
  }

  const payload = buildCampaignEmail({
    subject: `[TESTAS] ${campaign.subject}`,
    body: campaign.body,
    imageUrl: campaign.image_url,
    firstName: 'admin',
    siteUrl: SITE_URL,
  })
  // sendEmail niekada nemeta — klaidas grąžina per { ok: false }, todėl
  // rezultatą PRIVALOMA tikrinti (kitaip „test-sent" rodytųsi net kai
  // Resend nesukonfigūruotas ar siuntimas nepavyko).
  const result = await sendEmail({
    to: testEmail,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
  if (!result.ok) {
    console.error('[admin/kampanijos] sendTest failed:', result.reason)
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
    .select('id, subject, body, image_url, status')
    .eq('id', id)
    .maybeSingle()

  if (!campaign) redirect('/admin/kampanijos?error=not-found')

  if (campaign.status !== 'draft') {
    // Idempotencija — pakartotinai siųsti negalima.
    redirect(`/admin/kampanijos/${id}?error=already-sent`)
  }

  // 1) Atominis compare-and-swap į 'sending': update sąlygotas .eq('status',
  // 'draft') — du lygiagretūs paspaudimai (dvi kortelės/dvigubas klikas)
  // nebepraeis abu: antrasis nepakeis nė vienos eilutės ir bus atmestas
  // (auditas B15 — anksčiau patikra ir update buvo neatominiai TOCTOU).
  const { data: claimed } = await supabase
    .from('marketing_campaigns')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id')
  if (!claimed || claimed.length === 0) {
    redirect(`/admin/kampanijos/${id}?error=already-sent`)
  }

  // 2) Surenkam patvirtintus vartotojus (arba pasirinktą poaibį) + email.
  // marketing_opt_out=true (atsisakę per unsubscribe nuorodą) praleidžiami
  // net jei admin'as juos pažymėjo picker'yje — opt-out yra galutinis.
  let profilesQuery = supabase
    .from('user_profiles')
    .select('id, first_name')
    .eq('verification_status', 'approved')
    .eq('marketing_opt_out', false)

  if (selectedRecipientIds.length > 0) {
    profilesQuery = profilesQuery.in('id', selectedRecipientIds)
  }
  const { data: profiles } = await profilesQuery

  const profileById = new Map<string, { firstName: string | null }>()
  for (const p of profiles ?? []) {
    profileById.set(p.id, { firstName: p.first_name })
  }

  // listUsers puslapiuojamas (iki 5000 vartotojų) — anksčiau imtas tik
  // pirmas 1000 puslapis ir gavėjai už ribos tyliai iškrisdavo (auditas B14).
  const recipients: { userId: string; email: string; firstName: string | null }[] = []
  for (let page = 1; page <= 5; page++) {
    const { data: usersResp } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })
    const users = usersResp?.users ?? []
    for (const u of users) {
      if (!u.email) continue
      const profile = profileById.get(u.id)
      if (!profile) continue // tik approved (+ pasirinkti, jei selectedRecipientIds.length > 0)
      recipients.push({
        userId: u.id,
        email: u.email,
        firstName: profile.firstName,
      })
    }
    if (users.length < 1000) break
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
      // Atsisakymo nuoroda — privaloma kiekviename marketingo laiške
      // (GDPR/ePrivacy) + List-Unsubscribe header'iai (Gmail/Yahoo bulk-sender
      // reikalavimas; be jų krenta deliverability).
      const unsubToken = createUnsubscribeToken(r.userId)
      const unsubscribeUrl = unsubToken
        ? `${SITE_URL}/api/marketing/atsisakyti?u=${r.userId}&t=${encodeURIComponent(unsubToken)}`
        : null

      const payload = buildCampaignEmail({
        subject: campaign.subject,
        body: campaign.body,
        imageUrl: campaign.image_url,
        firstName: r.firstName,
        siteUrl: SITE_URL,
        // Tracking pixel — per recipient eilutės UUID. Atidarius laišką
        // (arba Gmail/Outlook proxy iškart) endpoint'as fiksuos opened_at.
        trackingPixelUrl: recRow
          ? `${SITE_URL}/api/track/open/${recRow.id}`
          : null,
        unsubscribeUrl,
      })

      // SVARBU: sendEmail niekada nemeta klaidos — visos klaidos (Resend 429,
      // blogas adresas, nesukonfigūruotas raktas) grąžinamos per { ok: false }.
      // Netikrinant rezultato nepavykę laiškai žurnale būtų žymimi 'sent'.
      const result = await sendEmail({
        to: r.email,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        headers: unsubscribeUrl
          ? {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
          : undefined,
      })

      if (result.ok) {
        sentCount++
        if (recRow) {
          await supabase
            .from('marketing_campaign_recipients')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', recRow.id)
        }
      } else {
        failedCount++
        const errMsg =
          result.reason === 'not-configured'
            ? 'Resend nesukonfigūruotas'
            : (result.error ?? 'send-failed')
        console.error(`[admin/kampanijos] send to ${r.email} failed:`, errMsg)
        if (recRow) {
          await supabase
            .from('marketing_campaign_recipients')
            .update({ status: 'failed', error_message: errMsg.slice(0, 500) })
            .eq('id', recRow.id)
        }
      }
    } catch (err) {
      // Netikėta išimtis (ne sendEmail — jis nemeta) neturi nutraukti ciklo:
      // nutrūkus vidury, kampanija amžinai liktų 'sending' be atstatymo kelio.
      failedCount++
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[admin/kampanijos] send to ${r.email} threw:`, errMsg)
      if (recRow) {
        await supabase
          .from('marketing_campaign_recipients')
          .update({ status: 'failed', error_message: errMsg.slice(0, 500) })
          .eq('id', recRow.id)
      }
    }

    // Rate-limit apsauga (Resend default 2 req/s)
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
