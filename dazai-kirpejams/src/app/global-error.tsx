'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="lt">
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
            Kažkas nutiko ne taip
          </h1>
          <p style={{ color: '#6B6B6B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Atsiprašome — įvyko netikėta klaida. Pabandykite dar kartą.
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
            Bandyti dar kartą
          </button>
        </div>
      </body>
    </html>
  )
}
