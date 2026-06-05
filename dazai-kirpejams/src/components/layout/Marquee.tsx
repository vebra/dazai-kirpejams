import { getActiveBanners } from '@/lib/data/queries'
import type { Locale } from '@/i18n/config'

/**
 * Bėganti reklaminė juosta — naudoja banerį placement='marquee' (banners lentelė).
 * Tekstą redaguoja admin per Baneriai (banerio „Pavadinimas" = juostos tekstas;
 * „Fono spalva" — neprivaloma). Su data planavimu (starts_at/ends_at). Jei tokio
 * banerio nėra — nieko nerodo. Gerbia reduced-motion (global CSS sustabdo judesį).
 */
export async function Marquee({ lang }: { lang: Locale }) {
  const banners = await getActiveBanners('marquee', lang)
  const b = banners[0]
  if (!b?.title) return null

  const bg = b.backgroundColor || '#1A1A1A'
  const segment = `${b.title}   ·   `
  const half = segment.repeat(6)

  return (
    <div className="overflow-hidden" style={{ background: bg }} aria-label={b.title}>
      <div
        className="flex w-max whitespace-nowrap py-2"
        style={{ animation: 'dk-marquee 35s linear infinite' }}
      >
        <span className="text-[12px] font-semibold tracking-[0.18em] uppercase text-white/85">
          {half}
        </span>
        <span
          className="text-[12px] font-semibold tracking-[0.18em] uppercase text-white/85"
          aria-hidden
        >
          {half}
        </span>
      </div>
    </div>
  )
}
