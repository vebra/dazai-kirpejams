import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import '../../globals.css'
import { getRepUser } from '@/lib/rep/auth'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Vadybininkės sritis | Dažai Kirpėjams', template: '%s | DK Vadyba' },
  robots: { index: false, follow: false },
}

// Visa rep zona dinaminė — auth/sesija kiekvienam request'ui, niekada nekešuojama.
export const dynamic = 'force-dynamic'

const NAV = [
  { href: '/vadybininke/naujas-uzsakymas', label: 'Naujas užsakymas' },
  { href: '/vadybininke/klientai', label: 'Klientai' },
  { href: '/vadybininke/uzsakymai', label: 'Mano užsakymai' },
]

export default async function RepRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rep = await getRepUser()

  return (
    <html lang="lt" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F5F5F7] text-brand-gray-900 antialiased">
        {rep ? (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-[#eee] sticky top-0 z-40">
              <div className="max-w-5xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 min-w-0">
                  <Link href="/vadybininke/naujas-uzsakymas" className="font-extrabold text-brand-magenta whitespace-nowrap">
                    DK Vadyba
                  </Link>
                  <nav className="hidden sm:flex items-center gap-1">
                    {NAV.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-brand-gray-600 hover:bg-[#F5F5F7] hover:text-brand-gray-900 transition-colors"
                      >
                        {n.label}
                      </Link>
                    ))}
                  </nav>
                </div>
                <form action="/vadybininke/logout" method="post">
                  <button
                    type="submit"
                    className="text-[13px] font-medium text-brand-gray-500 hover:text-red-600 transition-colors"
                  >
                    Atsijungti
                  </button>
                </form>
              </div>
              {/* Mobili nav */}
              <nav className="sm:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-brand-gray-600 hover:bg-[#F5F5F7] whitespace-nowrap"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </header>
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6">{children}</main>
          </div>
        ) : (
          // Neprisijungęs — login puslapis turi savo visaekranio turinį
          children
        )}
      </body>
    </html>
  )
}
