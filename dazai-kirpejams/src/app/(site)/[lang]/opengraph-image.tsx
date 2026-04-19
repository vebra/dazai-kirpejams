import { ImageResponse } from 'next/og'
import {
  OG_SIZE,
  OgLayout,
  loadFonts,
  MAGENTA,
  DARK,
  GRAY,
} from '@/lib/og'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'

export const alt = 'Dažai Kirpėjams — Profesionalūs plaukų dažai kirpėjams'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = hasLocale(lang) ? lang : 'lt'
  const dict = await getDictionary(locale)
  const t = dict.og

  return new ImageResponse(
    (
      <OgLayout>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: DARK, lineHeight: 1.15 }}>
            {t.titleMain}
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, color: MAGENTA, lineHeight: 1.15 }}>
            {t.titleAccent}
          </div>
          <div
            style={{
              fontSize: 24,
              color: GRAY,
              marginTop: 24,
              lineHeight: 1.5,
            }}
          >
            {t.subtitle}
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {[t.pill1, t.pill2, t.pill3].map(
              (text) => (
                <span
                  key={text}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: MAGENTA,
                    backgroundColor: '#FDF0F7',
                    padding: '8px 18px',
                    borderRadius: 8,
                  }}
                >
                  {text}
                </span>
              )
            )}
          </div>
        </div>
      </OgLayout>
    ),
    { ...size, fonts: await loadFonts() }
  )
}
