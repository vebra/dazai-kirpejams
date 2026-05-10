'use client'

import { useState } from 'react'

type ShareLabels = {
  title: string
  facebook: string
  whatsapp: string
  copy: string
  copied: string
}

/**
 * Share mygtukai blog įrašui. Klientinis komponentas, nes:
 *  - Copy-to-clipboard reikia naršyklės API
 *  - „Copied!" būsena su useState
 * Facebook ir WhatsApp share — paprasti share linkai (ne SDK), neatveda
 * privatumo tracker'iams kol vartotojas nepaspaudžia.
 */
export function ShareButtons({
  url,
  title,
  labels,
}: {
  url: string
  title: string
  labels: ShareLabels
}) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  const waUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Senesnės naršyklės be clipboard API — fallback į prompt'ą.
      window.prompt(labels.copy, url)
    }
  }

  const btnCls =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E0E0E0] bg-white text-[0.85rem] font-medium text-brand-gray-900 hover:border-brand-magenta hover:text-brand-magenta hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[0.82rem] font-semibold uppercase tracking-wider text-brand-gray-500 mr-1">
        {labels.title}
      </span>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.facebook}
        className={btnCls}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
          <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07C2 17.1 5.66 21.27 10.44 22v-7.02H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.27 22 17.1 22 12.07z" />
        </svg>
        Facebook
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.whatsapp}
        className={btnCls}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.5 9.5 0 0 1-4.84-1.32l-.35-.21-3.6.94.96-3.5-.23-.36a9.43 9.43 0 0 1-1.45-5.04C2.52 6.83 6.78 2.58 12.04 2.58c2.55 0 4.95.99 6.75 2.79a9.45 9.45 0 0 1 2.79 6.75c0 5.26-4.27 9.51-9.54 9.51zm8.1-17.6A11.42 11.42 0 0 0 12.05.5C5.65.5.43 5.71.43 12.11c0 2.05.54 4.05 1.55 5.81L.34 23.5l5.74-1.5a11.6 11.6 0 0 0 5.97 1.62h.01c6.4 0 11.62-5.21 11.62-11.61 0-3.1-1.21-6.02-3.41-8.21z" />
        </svg>
        WhatsApp
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={labels.copy}
        className={btnCls}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden
        >
          {copied ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  )
}
