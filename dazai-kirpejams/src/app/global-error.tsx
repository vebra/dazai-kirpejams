'use client'

import { useEffect, useState } from 'react'

const messages = {
  lt: {
    title: 'Kažkas nutiko ne taip',
    desc: 'Atsiprašome — įvyko netikėta klaida. Pabandykite dar kartą.',
    retry: 'Bandyti dar kartą',
  },
  en: {
    title: 'Something went wrong',
    desc: 'Sorry — an unexpected error occurred. Please try again.',
    retry: 'Try again',
  },
  ru: {
    title: 'Что-то пошло не так',
    desc: 'Извините — произошла непредвиденная ошибка. Попробуйте ещё раз.',
    retry: 'Попробовать ещё раз',
  },
} as const

type Lang = keyof typeof messages

function detectLang(): Lang {
  if (typeof window === 'undefined') return 'lt'
  const seg = window.location.pathname.split('/')[1]
  if (seg === 'en' || seg === 'ru') return seg
  return 'lt'
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const [lang, setLang] = useState<Lang>('lt')

  useEffect(() => {
    console.error('[global-error]', error)
    setLang(detectLang())
  }, [error])

  const t = messages[lang]

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#F5F5F7',
          color: '#1A1A1A',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 480 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {t.title}
          </h1>
          <p style={{ color: '#6B6B6B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {t.desc}
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: '#E91E8C',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  )
}
