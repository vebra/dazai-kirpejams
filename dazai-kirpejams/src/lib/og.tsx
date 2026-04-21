import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_URL } from '@/lib/seo'

export const OG_SIZE = { width: 1200, height: 630 }

/**
 * @vercel/og runs on edge runtime ir negali resolve'inti relative path'ų
 * (pvz. `/colors/foo.jpg`). Grąžinam absoliučią formą arba null, jei nėra.
 */
export function absoluteOgImage(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Brand colours from CLAUDE.md */
const MAGENTA = '#E91E8C'
const DARK = '#1A1A1A'
const GRAY = '#6B6B6B'
const LIGHT_BG = '#F5F5F7'

export async function loadFonts() {
  const [interRegular, interBold] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Inter-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Inter-Bold.ttf')),
  ])
  return [
    { name: 'Inter', data: interRegular, style: 'normal' as const, weight: 400 as const },
    { name: 'Inter', data: interBold, style: 'normal' as const, weight: 700 as const },
  ]
}

/**
 * Base OG layout — white card with magenta accent bar, logo area, and content.
 * Used by all opengraph-image generators for consistent branding.
 */
export function OgLayout({
  children,
  badge,
}: {
  children: React.ReactNode
  badge?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: LIGHT_BG,
        fontFamily: 'Inter',
      }}
    >
      {/* Top magenta accent bar */}
      <div style={{ height: 6, backgroundColor: MAGENTA, display: 'flex' }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 64px 40px',
        }}
      >
        {/* Badge */}
        {badge && (
          <div
            style={{
              display: 'flex',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: MAGENTA,
              }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Main content */}
        {children}
      </div>

      {/* Bottom bar with brand name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: MAGENTA,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            DK
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: DARK }}>
            Dažai Kirpėjams
          </span>
        </div>
        <span style={{ fontSize: 14, color: GRAY }}>
          www.dazaikirpejams.lt
        </span>
      </div>
    </div>
  )
}

/**
 * Truncates text to a max length, adding ellipsis if needed.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

/**
 * Format price from cents to display string.
 */
export function formatPriceOg(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`
}

export { MAGENTA, DARK, GRAY, LIGHT_BG }
