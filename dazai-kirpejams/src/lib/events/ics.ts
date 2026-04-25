import 'server-only'
import type { EventInfo } from './config'

/**
 * Minimalus RFC 5545 iCalendar generatorius. Grąžina `Buffer`, tinkantį
 * Resend `attachments`. Nenaudojam `ics` npm paketo — paprastas VEVENT
 * mums pakanka, o vengiam papildomos priklausomybės.
 *
 * Pastabos:
 *  - Laikus siunčiam UTC (sufix 'Z'), kad kalendoriai nekeltų klausimų dėl
 *    TZID rezolucijos. Pradinis laikas jau buvo parašytas su +03:00 offset'u
 *    config'e, `toISOString()` jį teisingai paverčia į UTC.
 *  - CRLF (`\r\n`) privalomas — kai kurie parseriai atmeta LF-only failus.
 *  - `PRODID` identifikuoja kalendoriaus gamintoją, `UID` turi būti unikalus
 *    kiekvienai registracijai (naudojam `registration:<id>@dazaikirpejams.lt`).
 */

export type IcsInput = {
  event: EventInfo
  /** Unikalus registracijos ID (saugomas kalendoriuje, leis ateityje update'us) */
  registrationId: string
  /** Dalyvio el. paštas — prireiks CANCEL email'uose ateityje */
  attendeeEmail: string
  /** Dalyvio vardas */
  attendeeName: string
  /** Pilnas URL į renginio puslapį */
  eventUrl: string
  /** `REQUEST` — naujas kvietimas; `CANCEL` — atšaukimas ateityje */
  method?: 'REQUEST' | 'CANCEL'
}

function formatUtc(d: Date): string {
  // 2026-05-17T07:00:00Z → 20260517T070000Z
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s: string): string {
  // RFC 5545: escape \, ;, ,, ir paverst newline į \n
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Sulenkia eilutes iki 75 oktetų (RFC 5545 3.1). Tęsinio eilutė prasideda
 * vienu tarpu. Skirtingu atveju Gmail/Outlook gali iškraipyti ilgus
 * aprašymus.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let remaining = line
  // Pirma eilutė — 75 simboliai
  parts.push(remaining.slice(0, 75))
  remaining = remaining.slice(75)
  // Tęsiniai — po 74 simbolius (vienas tarpas pradžioje)
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 74))
    remaining = remaining.slice(74)
  }
  return parts.join('\r\n')
}

export function buildIcsFile(input: IcsInput): Buffer {
  const { event, registrationId, attendeeEmail, attendeeName, eventUrl } = input
  const method = input.method ?? 'REQUEST'

  const now = new Date()
  const uid = `registration-${registrationId}@dazaikirpejams.lt`
  const summary = escapeText(event.title)
  const description = escapeText(
    `${event.description}\n\nPrezentuoja: ${event.presenterName} (${event.presenterTitle}).\nDaugiau informacijos: ${eventUrl}`
  )
  const location = escapeText(
    `${event.venueName}, ${event.venueStreet}, ${event.venueCity}`
  )

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dazai Kirpejams//Event Registration//LT',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(event.endsAt)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `URL:${eventUrl}`,
    `ORGANIZER;CN=${escapeText(event.presenterName)}:mailto:${event.contactEmail}`,
    `ATTENDEE;CN=${escapeText(attendeeName)};RSVP=TRUE:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(foldLine)
    .join('\r\n')

  return Buffer.from(lines, 'utf-8')
}
