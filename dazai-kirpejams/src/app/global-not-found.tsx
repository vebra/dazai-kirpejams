import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Page not found — Dažai Kirpėjams',
  description: 'The page you are looking for does not exist or has moved.',
}

export default function GlobalNotFound() {
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
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 520 }}>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#E91E8C',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              lineHeight: 1.3,
            }}
          >
            Puslapis nerastas
            <span style={{ display: 'block', fontSize: '1.1rem', color: '#6B6B6B', fontWeight: 600 }}>
              Page not found · Страница не найдена
            </span>
          </h1>
          <p
            style={{
              color: '#6B6B6B',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            Ieškomas puslapis neegzistuoja arba buvo perkeltas.
            <br />
            The page you are looking for does not exist or has moved.
            <br />
            Запрашиваемая страница не существует или была перемещена.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              backgroundColor: '#E91E8C',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            Grįžti į pradžią · Back home · На главную
          </Link>
        </div>
      </body>
    </html>
  )
}
