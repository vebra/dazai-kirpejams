import { unstable_cache } from 'next/cache'

/**
 * Lietuvos Omniva paštomatų sąrašas checkout'o picker'iui.
 *
 * Šaltinis — oficialus Omniva locations.json (visos Baltijos šalys, ~1.4MB).
 * Filtruojam tik LT paštomatus (TYPE 0 = paštomatas, ne paštas) ir grąžinam
 * suplonintą sąrašą (~60KB). Kešuojam 24h per unstable_cache — kešuojasi tik
 * suplonintas rezultatas, o ne visas Omniva atsakymas. Klaidos NEkešuojamos:
 * jei Omniva nepasiekiama, klientas gauna 502 ir picker'is parodo rankinio
 * įvedimo lauką (žr. OmnivaLockerPicker fallback).
 */

const OMNIVA_LOCATIONS_URL = 'https://www.omniva.ee/locations.json'

type OmnivaLocation = {
  ZIP: string
  NAME: string
  TYPE: string
  A0_NAME: string // šalis (LT/EE/LV)
  A2_NAME: string // savivaldybė
  A3_NAME: string // miestas
  A5_NAME: string // gatvė
  A7_NAME: string // namo nr.
}

export type OmnivaLocker = {
  id: string
  name: string
  city: string
  address: string
}

const getLockers = unstable_cache(
  async (): Promise<OmnivaLocker[]> => {
    const res = await fetch(OMNIVA_LOCATIONS_URL, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Omniva locations fetch failed: ${res.status}`)
    }
    const all: OmnivaLocation[] = await res.json()
    const lockers = all
      .filter((l) => l.A0_NAME === 'LT' && l.TYPE === '0')
      .map((l) => ({
        id: l.ZIP,
        name: l.NAME,
        city: l.A3_NAME || l.A2_NAME,
        address: [l.A5_NAME, l.A7_NAME].filter(Boolean).join(' '),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'lt'))
    // Tuščias sąrašas reikštų sugedusį upstream formatą — geriau klaida
    // (nekešuojama) negu 24h kešuota tuštuma.
    if (lockers.length === 0) {
      throw new Error('Omniva locations: no LT lockers in response')
    }
    return lockers
  },
  ['omniva-lockers-lt'],
  { revalidate: 86400 }
)

export async function GET() {
  try {
    const lockers = await getLockers()
    return Response.json(lockers, {
      headers: {
        // CDN kešas — antras sluoksnis virš unstable_cache
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    })
  } catch {
    return Response.json([], { status: 502 })
  }
}
