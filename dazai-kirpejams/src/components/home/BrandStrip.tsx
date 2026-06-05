import { getActiveBanners } from '@/lib/data/queries'
import type { Locale } from '@/i18n/config'
import { BrandMarquee } from '@/components/ui/BrandMarquee'

/**
 * Dekoratyvinė „brand žodžių" juosta pagrindiniame puslapyje (tarp sekcijų).
 * Tekstą galima redaguoti per /admin/baneriai (placement='brandstrip':
 * „Pavadinimas" = viršutinė eilutė, „Paantraštė" = apatinė). Jei banerio nėra —
 * rodomi numatytieji brand žodžiai pagal kalbą.
 */
const DEFAULTS: Record<Locale, { row1: string; row2: string }> = {
  lt: {
    row1: '180 ML • COLOR SHOCK • PROFESIONALŪS PLAUKŲ DAŽAI • ROSANERA COSMETIC •',
    row2: 'DAUGIAU VERTĖS SALONUI • DIDESNĖ TALPA • SUKURTA PROFESIONALAMS •',
  },
  en: {
    row1: '180 ML • COLOR SHOCK • PROFESSIONAL HAIR COLOR • ROSANERA COSMETIC •',
    row2: 'MORE VALUE FOR YOUR SALON • BIGGER VOLUME • MADE FOR PROFESSIONALS •',
  },
  ru: {
    row1: '180 МЛ • COLOR SHOCK • ПРОФЕССИОНАЛЬНАЯ КРАСКА • ROSANERA COSMETIC •',
    row2: 'БОЛЬШЕ ВЫГОДЫ ДЛЯ САЛОНА • БОЛЬШИЙ ОБЪЁМ • ДЛЯ ПРОФЕССИОНАЛОВ •',
  },
}

export async function BrandStrip({ lang }: { lang: Locale }) {
  const banners = await getActiveBanners('brandstrip', lang)
  const b = banners[0]
  const d = DEFAULTS[lang] ?? DEFAULTS.lt
  const row1 = b?.title?.trim() || d.row1
  const row2 = b?.subtitle?.trim() || d.row2
  return <BrandMarquee row1={row1} row2={row2} />
}
