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
      }
    } catch {
      /* localStorage nebūtinas */
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
          <Link href={href} className="underline font-semibold ml-1.5 hover:opacity-90">
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
