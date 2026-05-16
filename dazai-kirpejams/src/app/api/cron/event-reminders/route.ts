import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildEventReminderEmail } from '@/lib/events/emails'
import { getVisibleUpcomingEvents } from '@/lib/events/queries'
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
 * Kelių renginių palaikymas: iteruojam VISUS matomus (`is_active=true`)
 * upcoming renginius. Tai reiškia — jei renginys neįvyks dėl techninių
 * kliūčių, admin'as tiesiog jį išjungia per /admin/renginiai („Išjungti"),
 * ir priminimo el. laiškas „renginys įvyks" NEBESIUNČIAMAS. Išjungtas
 * renginys nepatenka į `getVisibleUpcomingEvents()`, todėl cron'as jį
 * praleidžia automatiškai.
 *
 * Idempotentiškumas: filtruojam tik eilutes, kur `reminder_sent_at IS NULL`,
 * ir iškart po sėkmingo išsiuntimo update'inam timestamp'ą. Jei cron'as
 * paleidžiamas du kartus per valandą — antras paleidimas tiesiog neras ką
 * siųsti.
 *
 * Laiko langas: nuo 20h iki 28h prieš `startsAt` — 8h plokščias langas, kad
 * nesirištume į tikslias vienos dienos valandas. Cron scheduling'as
 * (vercel.json) paleis endpoint'ą kasdien ~10:00 UTC.
 */

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const events = await getVisibleUpcomingEvents()
  const now = new Date()
  const supabase = createServerClient()

  const results: Array<{
    eventSlug: string
    hoursUntilEvent: number
    skipped?: string
    totalCandidates?: number
    sent?: number
    failed?: number
  }> = []

  for (const EVENT of events) {
    const hoursUntil =
      (EVENT.startsAt.getTime() - now.getTime()) / (60 * 60 * 1000)

    // Už priminimo lango — šiam renginiui nieko nesiųsim.
    if (hoursUntil < 20 || hoursUntil > 28) {
      results.push({
        eventSlug: EVENT.slug,
        hoursUntilEvent: Math.round(hoursUntil),
        skipped: 'outside-reminder-window',
      })
      continue
    }

    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('id, first_name, email')
      .eq('event_slug', EVENT.slug)
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null)

    if (error) {
      console.error(
        '[cron/event-reminders] select:',
        EVENT.slug,
        error.message
      )
      results.push({
        eventSlug: EVENT.slug,
        hoursUntilEvent: Math.round(hoursUntil),
        skipped: 'db-error',
      })
      continue
    }

    const eventUrl = `${SITE_URL}/renginys/${EVENT.slug}`
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
          EVENT.slug,
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
          EVENT.slug,
          updateError.message
        )
        // Email'as jau išsiųstas — kitą cron iteraciją vėl pasiųs. Prioritetas:
        // nelikti registracijai be priminimo, net jei kartais bus dublikatas.
      } else {
        sent += 1
      }
    }

    results.push({
      eventSlug: EVENT.slug,
      hoursUntilEvent: Math.round(hoursUntil),
      totalCandidates: registrations?.length ?? 0,
      sent,
      failed,
    })
  }

  return NextResponse.json({
    ok: true,
    eventsChecked: events.length,
    results,
  })
}
