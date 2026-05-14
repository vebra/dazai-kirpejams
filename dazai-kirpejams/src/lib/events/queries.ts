import { unstable_cache } from 'next/cache'
import { DAZU_PREZENTACIJA_2026, type EventInfo } from './config'

/**
 * Renginių DB query'iai su fallback į hardcoded reikšmes.
 *
 * Lentelė `events` (migracija 028 + 031) palaiko kelis renginius vienu metu.
 * Kiekvienas turi `is_active` (per-event viešo matomumo perjungiklis).
 * Admin redaguoja per /admin/renginiai puslapį.
 *
 * Fallback: jei DB neprieinamas arba lentelės dar nėra, viešas puslapis
 * grįžta prie hardcoded'into DAZU_PREZENTACIJA_2026 — apsauga nuo 500 klaidų.
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
  let hh = get('hour')
  if (hh === '24') hh = '00'
  const min = get('minute')
  const ss = get('second')

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

type CachedEventDto = {
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
  hero_image_url: string | null
  display_order: number
}

const EVENT_COLUMNS =
  'slug, is_active, title, short_title, description, starts_at, ends_at, venue_name, venue_street, venue_city, venue_country, venue_postal_code, presenter_name, presenter_title, is_free, capacity_min, capacity_max, contact_email, path, hero_image_url, display_order'

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
    heroImageUrl: row.hero_image_url ?? null,
  }
}

/** Lapinis tipas — `EventInfo` + admin'ui aktualus `isActive` (visibility). */
export type EventAdminInfo = EventInfo & {
  isActive: boolean
  displayOrder: number
}

function dtoToAdminInfo(row: CachedEventDto): EventAdminInfo {
  return {
    ...dtoToEventInfo(row),
    isActive: row.is_active,
    displayOrder: row.display_order,
  }
}

// ============================================
// Public queries (cache'inamos)
// ============================================

async function _getEventBySlugDto(slug: string): Promise<CachedEventDto | null> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('slug', slug)
      .maybeSingle<CachedEventDto>()

    if (error) {
      console.error('[events/queries] getEventBySlug:', error.message)
      return null
    }
    return data ?? null
  } catch (e) {
    console.error('[events/queries] getEventBySlug exception:', e)
    return null
  }
}

/** Renginys pagal slug'ą — nepriklausomai nuo `is_active` (admin'ui). */
export async function getEventBySlug(slug: string): Promise<EventInfo | null> {
  const dto = await unstable_cache(
    () => _getEventBySlugDto(slug),
    ['event-by-slug', slug],
    { revalidate: 60, tags: [ACTIVE_EVENT_TAG, `event:${slug}`] },
  )()
  return dto ? dtoToEventInfo(dto) : null
}

/**
 * Renginys pagal slug'ą TIK jei `is_active=true`. Naudoja viešas /renginys/[slug]
 * route'as — paslėptam renginiui grąžina null → 404.
 */
export async function getActiveEventBySlug(
  slug: string,
): Promise<EventInfo | null> {
  const dto = await unstable_cache(
    () => _getEventBySlugDto(slug),
    ['event-by-slug', slug],
    { revalidate: 60, tags: [ACTIVE_EVENT_TAG, `event:${slug}`] },
  )()
  if (!dto || !dto.is_active) return null
  return dtoToEventInfo(dto)
}

async function _getVisibleUpcomingEventsDto(): Promise<CachedEventDto[]> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()
    // „Upcoming" = ends_at + 24h dar ateityje (atitinka isEventPast()).
    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('is_active', true)
      .gt('ends_at', cutoffIso)
      .order('display_order', { ascending: true })
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('[events/queries] getVisibleUpcomingEvents:', error.message)
      return []
    }
    return (data ?? []) as CachedEventDto[]
  } catch (e) {
    console.error('[events/queries] getVisibleUpcomingEvents exception:', e)
    return []
  }
}

const getVisibleUpcomingEventsDtoCached = unstable_cache(
  _getVisibleUpcomingEventsDto,
  ['visible-upcoming-events'],
  { revalidate: 60, tags: [ACTIVE_EVENT_TAG] },
)

/** Visi viešai matomi renginiai, kurių pabaiga + 24h dar ateityje. */
export async function getVisibleUpcomingEvents(): Promise<EventInfo[]> {
  const rows = await getVisibleUpcomingEventsDtoCached()
  return rows.map(dtoToEventInfo)
}

/**
 * Arčiausias upcoming visibly renginys — backward-compat su senuoju
 * `getActiveEvent()`. Naudoja /renginys (be slug'o) redirect'ui ir homepage
 * sekcijai, kuri rodo tik vieną renginį.
 */
export async function getNearestUpcomingVisibleEvent(): Promise<EventInfo | null> {
  const list = await getVisibleUpcomingEvents()
  return list[0] ?? null
}

// ============================================
// Admin queries (be cache — admin'ui reikia šviežių duomenų)
// ============================================

/** Visi renginiai (admin sąrašui) — rūšiuoti pagal display_order, starts_at. */
export async function getAllEvents(): Promise<EventAdminInfo[]> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .order('display_order', { ascending: true })
      .order('starts_at', { ascending: true })

    if (error) {
      console.error('[events/queries] getAllEvents:', error.message)
      return []
    }
    return ((data ?? []) as CachedEventDto[]).map(dtoToAdminInfo)
  } catch (e) {
    console.error('[events/queries] getAllEvents exception:', e)
    return []
  }
}

// ============================================
// Backward-compat — kol kiti file'ai dar naudoja
// ============================================

/**
 * @deprecated Naudoti `getNearestUpcomingVisibleEvent()` arba
 * `getEventBySlug(slug)`. Liko, kad nesulaužytume callsites'ų refactor'o metu.
 * Jei nėra matomo renginio — grąžina hardcoded'intą fallback'ą.
 */
export async function getActiveEvent(): Promise<EventInfo> {
  const nearest = await getNearestUpcomingVisibleEvent()
  return nearest ?? DAZU_PREZENTACIJA_2026
}
