/**
 * Renginio duomenys vienoje vietoje — naudoja puslapis, email'ai, ICS
 * generatorius, JSON-LD schema, admin ir cron priminimas.
 *
 * Datos laikomos su eksplicitine Europe/Vilnius laiko juosta
 * (UTC+02:00 vasarą, UTC+03:00 žiemą). 2026-05-17 — EEST = UTC+03:00.
 *
 * Pridedant naują renginį: sukurti naują `EventInfo` ir (jei reikia) pridėti
 * route'ą. Dabartinis puslapis rodo `DAZU_PREZENTACIJA_2026` pagal slug.
 */

export type EventInfo = {
  slug: string
  title: string
  shortTitle: string
  description: string
  startsAt: Date
  endsAt: Date
  /** ISO forma su laiko juostos offset'u — JSON-LD ir ICS */
  startsAtIso: string
  endsAtIso: string
  venueName: string
  venueStreet: string
  venueCity: string
  venueCountry: string
  venuePostalCode?: string
  presenterName: string
  presenterTitle: string
  isFree: boolean
  capacityMin: number
  capacityMax: number
  contactEmail: string
  /** Santykinis kelias puslapiui (pvz. `/renginys`) */
  path: string
}

export const DAZU_PREZENTACIJA_2026: EventInfo = {
  slug: 'dazu-prezentacija-kaune-2026-05-17',
  title: 'Color SHOCK dažų prezentacija Kaune',
  shortTitle: 'Dažų prezentacija Kaune',
  description:
    'Gyvas Color SHOCK dažų pristatymas: naujausios dažymo technikos, produktų demonstracija ant modelio ir Q&A sesija. Vaišės, dovanos dalyviams. Įėjimas nemokamas, bet būtina registracija.',
  // 2026-05-17 10:00–15:00 Europe/Vilnius (EEST = UTC+03:00)
  startsAt: new Date('2026-05-17T10:00:00+03:00'),
  endsAt: new Date('2026-05-17T15:00:00+03:00'),
  startsAtIso: '2026-05-17T10:00:00+03:00',
  endsAtIso: '2026-05-17T15:00:00+03:00',
  venueName: 'Įvaizdžio salonas 313 „Rolė"',
  venueStreet: 'Kipro Petrausko g. 44',
  venueCity: 'Kaunas',
  venueCountry: 'LT',
  presenterName: 'Džiuljeta Vėbrė',
  presenterTitle: 'Color SHOCK atstovė',
  isFree: true,
  capacityMin: 30,
  capacityMax: 50,
  contactEmail: 'info@dziuljetavebre.lt',
  path: '/renginys',
}

/** Ar renginys jau įvyko (registracijos uždaromos +1 d po endsAt). */
export function isEventPast(event: EventInfo, now = new Date()): boolean {
  const closingBuffer = 24 * 60 * 60 * 1000 // +24h po endsAt
  return now.getTime() > event.endsAt.getTime() + closingBuffer
}

/** LT lokalus laikas, pvz. „2026 m. gegužės 17 d., 10:00–15:00". */
export function formatEventDateLt(event: EventInfo): string {
  const dateFmt = new Intl.DateTimeFormat('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Vilnius',
  })
  const timeFmt = new Intl.DateTimeFormat('lt-LT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Vilnius',
  })
  return `${dateFmt.format(event.startsAt)}, ${timeFmt.format(event.startsAt)}–${timeFmt.format(event.endsAt)}`
}
