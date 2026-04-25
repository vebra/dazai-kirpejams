import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildEventReminderEmail } from '@/lib/events/emails'
import { DAZU_PREZENTACIJA_2026 } from '@/lib/events/config'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Vercel Cron endpoint — siunčia priminimą likus ≤24h iki renginio pradžios.
 *
 * Saugumas: Vercel Cron'as prideda `Authorization: Bearer $CRON_SECRET` header'į.
 * Be jo request'as atmetamas — kad niekas iš interneto negalėtų trigger'inti
 * masinio email siuntimo.
 *
 * Idempotentiškumas: filtruojam tik eilutes, kur `reminder_sent_at IS NULL`,
 * ir iškart po sėkmingo išsiuntimo update'inam timestamp'ą. Jei cron'as
 * paleidžiamas du kartus per valandą — antras paleidimas tiesiog neras ką
 * siųsti.
 *
 * Laiko langas: nuo 20h iki 28h prieš `startsAt` — 8h plokščias langas, kad
 * nesirištume į tikslias vienos dienos valandas. Cron scheduling'as
 * (vercel.json) paleis endpoint'ą kasdien ~10:00 UTC; tai užtikrina, kad
 * bet kuriuo atveju priminimas išeina likus ~22–24h iki 10:00 LT renginio.
 */

const EVENT = DAZU_PREZENTACIJA_2026

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const startsAt = EVENT.startsAt.getTime()
  const hoursUntil = (startsAt - now.getTime()) / (60 * 60 * 1000)

  // Už lango — nieko nesiųsim
  if (hoursUntil < 20 || hoursUntil > 28) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'outside-reminder-window',
      hoursUntilEvent: Math.round(hoursUntil),
    })
  }

  const supabase = createServerClient()

  const { data: registrations, error } = await supabase
    .from('event_registrations')
    .select('id, first_name, email')
    .eq('event_slug', EVENT.slug)
    .eq('status', 'confirmed')
    .is('reminder_sent_at', null)

  if (error) {
    console.error('[cron/event-reminders] select:', error.message)
    return NextResponse.json(
      { ok: false, error: 'db-error' },
      { status: 500 }
    )
  }

  const eventUrl = `${SITE_URL}/lt${EVENT.path}`
  let sent = 0
  let failed = 0

  for (const reg of registrations ?? []) {
    const tpl = buildEventReminderEmail({
      event: EVENT,
      firstName: reg.first_name,
      eventUrl,
    })

    const result = await sendEmail({
      to: reg.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    })

    if (!result.ok) {
      failed += 1
      console.error(
        '[cron/event-reminders] send failed:',
        reg.email,
        result.reason
      )
      continue
    }

    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({
        reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.id)

    if (updateError) {
      console.error(
        '[cron/event-reminders] update reminder_sent_at:',
        updateError.message
      )
      // Email'as jau išsiųstas — kitą cron iteraciją vėl pasiųs. Prioritetas:
      // nelikti registracijai be priminimo, net jei kartais bus dublikatas.
    } else {
      sent += 1
    }
  }

  return NextResponse.json({
    ok: true,
    eventSlug: EVENT.slug,
    hoursUntilEvent: Math.round(hoursUntil),
    totalCandidates: registrations?.length ?? 0,
    sent,
    failed,
  })
}
