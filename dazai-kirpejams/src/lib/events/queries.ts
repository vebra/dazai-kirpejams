import { unstable_cache } from 'next/cache'
import { DAZU_PREZENTACIJA_2026, type EventInfo } from './config'

/**
 * Aktyvaus renginio DB query'is su fallback į hardcoded reikšmes.
 *
 * Renginio duomenis saugo `events` lentelė (migracija 028). Admin redaguoja
 * per /admin/renginiai puslapį. Šis helper grąžina `EventInfo` shape'ą,
 * kuris savaime sutampa su buvusiu `DAZU_PREZENTACIJA_2026` konstantu —
 * todėl visi callsites veikia be papildomo type mapping'o.
 *
 * Fallback: jei DB neprieinamas arba lentelės dar nėra (migracija
 * nepritaikyta), grąžinam hardcoded'intą DAZU_PREZENTACIJA_2026. Tai
 * apsaugo nuo viešo puslapio 500 klaidų lokaliam dev'e be Supabase.
 */

export const ACTIVE_EVENT_TAG = 'active-event'

/** Vilniaus laiko juostos offset'as milisekundėmis duotam UTC momentui. */
export function vilniusOffsetMs(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  let hh = get('hour')
  if (hh === '24') hh = '00'
  const wallAsUtc = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(hh),
    Number(get('minute')),
    Number(get('second')),
  )
  return wallAsUtc - d.getTime()
}

/**
 * Konvertuoja Vilniaus sieninio laikrodžio reikšmę (`YYYY-MM-DDTHH:MM`)
 * į UTC `Date`. DST-aware — naudoja Intl Vilnius'o offset'ą tai datai.
 */
export function vilniusWallToUtc(wallStr: string): Date {
  // Pirma — apdorojam wall'ą tarsi jis būtų UTC. Toks „blogasis" Date
  // mums duoda referencinį tašką, prie kurio prisirišus paimam realų
  // Vilniaus offset'ą (kuris gali skirtis pasienyje su DST, bet abi
  // pusės įstos į to paties offset'o ribas).
  const asIfUtc = new Date(wallStr + 'Z')
  return new Date(asIfUtc.getTime() - vilniusOffsetMs(asIfUtc))
}

/**
 * Konvertuoja UTC `Date` į HTML `<input type="datetime-local">` reikšmę
 * (`YYYY-MM-DDTHH:MM`) pagal Vilniaus laiko juostą.
 */
export function utcToVilniusInputValue(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  let hh = get('hour')
  if (hh === '24') hh = '00'
  return `${get('year')}-${get('month')}-${get('day')}T${hh}:${get('minute')}`
}

/** Apskaičiuoja ISO string'ą su Europe/Vilnius offset'u (EEST/EET). */
function toVilniusIso(d: Date): string {
  // Sprendžiam offset'ą per realią Vilniaus + UTC laiko skirtumą.
  // (Intl.DateTimeFormat'as DST'o atžvilgiu yra teisingas.)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const yyyy = get('year')
  const mm = get('month')
  const dd = get('day')
  // Intl gali grąžinti "24" vidurnaktiui — normalizuojam į "00"
  let hh = get('hour')
  if (hh === '24') hh = '00'
  const min = get('minute')
  const ss = get('second')

  // Offset = (Vilniaus laikas) − (UTC laikas) milisekundėmis
  const asLocal = Date.UTC(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    Number(ss),
  )
  const offsetMin = Math.round((asLocal - d.getTime()) / 60000)
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const offHh = String(Math.floor(abs / 60)).padStart(2, '0')
  const offMm = String(abs % 60).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${sign}${offHh}:${offMm}`
}

type DbEventRow = {
  slug: string
  is_active: boolean
  title: string
  short_title: string
  description: string
  starts_at: string
  ends_at: string
  venue_name: string
  venue_street: string
  venue_city: string
  venue_country: string
  venue_postal_code: string | null
  presenter_name: string
  presenter_title: string
  is_free: boolean
  capacity_min: number
  capacity_max: number
  contact_email: string
  path: string
}

/**
 * Cache'inama versija — JSON-friendly (ISO string'ai, ne Date'ai), nes
 * `unstable_cache` serializuoja per JSON ir Date instance neišlieka.
 */
type CachedEventDto = Omit<DbEventRow, 'is_active'>

async function _getActiveEventDto(): Promise<CachedEventDto | null> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('events')
      .select(
        'slug, title, short_title, description, starts_at, ends_at, venue_name, venue_street, venue_city, venue_country, venue_postal_code, presenter_name, presenter_title, is_free, capacity_min, capacity_max, contact_email, path'
      )
      .eq('is_active', true)
      .limit(1)
      .maybeSingle<CachedEventDto>()

    if (error) {
      console.error('[events/queries] getActiveEvent:', error.message)
      return null
    }
    return data ?? null
  } catch (e) {
    console.error('[events/queries] getActiveEvent exception:', e)
    return null
  }
}

const getActiveEventDtoCached = unstable_cache(
  _getActiveEventDto,
  ['active-event'],
  { revalidate: 60, tags: [ACTIVE_EVENT_TAG] },
)

function dtoToEventInfo(row: CachedEventDto): EventInfo {
  const startsAt = new Date(row.starts_at)
  const endsAt = new Date(row.ends_at)
  return {
    slug: row.slug,
    title: row.title,
    shortTitle: row.short_title,
    description: row.description,
    startsAt,
    endsAt,
    startsAtIso: toVilniusIso(startsAt),
    endsAtIso: toVilniusIso(endsAt),
    venueName: row.venue_name,
    venueStreet: row.venue_street,
    venueCity: row.venue_city,
    venueCountry: row.venue_country,
    venuePostalCode: row.venue_postal_code ?? undefined,
    presenterName: row.presenter_name,
    presenterTitle: row.presenter_title,
    isFree: row.is_free,
    capacityMin: row.capacity_min,
    capacityMax: row.capacity_max,
    contactEmail: row.contact_email,
    path: row.path,
  }
}

/**
 * Grąžina aktyvų renginį. Cache'as gyvuoja 60s — admin redagavimas iškart
 * iškviečia `updateTag(ACTIVE_EVENT_TAG)`, tad cache atnaujinamas iškart.
 * Jei DB nepasiekiamas arba lentelės dar nėra — fallback į hardcoded'intą
 * DAZU_PREZENTACIJA_2026 (apsauga nuo viešo puslapio 500 klaidų).
 */
export async function getActiveEvent(): Promise<EventInfo> {
  const dto = await getActiveEventDtoCached()
  return dto ? dtoToEventInfo(dto) : DAZU_PREZENTACIJA_2026
}
