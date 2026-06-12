'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = {
  id: string
  text: string
  ctaText: string | null
  href: string | null
  bg: string | null
}

/**
 * Statistikos beacon — best-effort, klaidos tylios (statistika nevertingesnė
 * už veikiantį puslapį). sendBeacon išgyvena puslapio palikimą po paspaudimo.
 */
function track(key: string, type: 'impression' | 'click') {
  const payload = JSON.stringify({ key, type })
  try {
    if (!navigator.sendBeacon?.('/api/banner-stats', payload)) {
      fetch('/api/banner-stats', {
        method: 'POST',
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* ignore */
  }
}

/**
 * Akcijų juosta — plonas pranešimas svetainės viršuje. Uždaroma (× mygtukas),
 * uždarymas įsimenamas per localStorage pagal banerio id, tad NAUJAS pranešimas
 * (kitas id) vėl pasirodys.
 */
export function AnnouncementBarClient({ id, text, ctaText, href, bg }: Props) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // Sinchronizacija su localStorage (client-only) — teisėtas setState effekte.
    try {
      if (localStorage.getItem(`dk-announce-${id}`) === '1') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHidden(true)
        return
      }
    } catch {
      /* localStorage nebūtinas */
    }
    // Parodymas — kartą per naršyklės sesiją (layout'as nepersikrauna tarp
    // client-side navigacijų, tad tai ≈ apsilankymas, ne puslapio peržiūra).
    try {
      const impKey = `dk-announce-imp-${id}`
      if (sessionStorage.getItem(impKey) !== '1') {
        sessionStorage.setItem(impKey, '1')
        track(id, 'impression')
      }
    } catch {
      /* sessionStorage nebūtinas */
    }
  }, [id])

  if (hidden) return null

  function dismiss() {
    setHidden(true)
    try {
      localStorage.setItem(`dk-announce-${id}`, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="relative text-white text-[13px] leading-snug text-center px-10 py-2"
      style={{ background: bg || '#E91E8C' }}
    >
      <span>
        {text}
        {href && (
          <Link
            href={href}
            onClick={() => track(id, 'click')}
            className="underline font-semibold ml-1.5 hover:opacity-90"
          >
            {ctaText || 'Plačiau'}
          </Link>
        )}
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Uždaryti pranešimą"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/15 text-white/90 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
