import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { Plus } from 'lucide-react'
import '../../globals.css'
import { getRepUser } from '@/lib/rep/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { RepDesktopNav, RepMobileTabBar } from './RepNav'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Vadybininkės sritis | Dažai Kirpėjams', template: '%s | DK Vadyba' },
  robots: { index: false, follow: false },
  // PWA: „Pridėti į pradžios ekraną" telefone — atsidaro kaip programėlė.
  manifest: '/vadybininke.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'DK Vadyba' },
}

// Visa rep zona dinaminė — auth/sesija kiekvienam request'ui, niekada nekešuojama.
export const dynamic = 'force-dynamic'

export default async function RepRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rep = await getRepUser()

  let initials = ''
  let pendingCount = 0
  let rejectedCount = 0
  if (rep) {
    const supabase = await createServerSupabase()
    // eslint-disable-next-line react-hooks/purity -- server komponentas su force-dynamic: reikšmė tyčia skaičiuojama kiekvieno request'o metu
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    const [{ data: prof }, { data: badgeRows }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', rep.user.id)
        .maybeSingle(),
      supabase
        .from('orders')
        .select('approval_status, created_at')
        .eq('placed_by', rep.user.id)
        .in('approval_status', ['pending', 'rejected']),
    ])
    initials =
      `${prof?.first_name?.[0] ?? ''}${prof?.last_name?.[0] ?? ''}`.toUpperCase() ||
      (rep.user.email?.[0] ?? '?').toUpperCase()
    for (const o of badgeRows ?? []) {
      if (o.approval_status === 'pending') pendingCount++
      // Atmesti rodomi tik savaitę — seni nebebadina akių amžinai.
      else if (o.created_at >= weekAgo) rejectedCount++
    }
  }

  return (
    <html lang="lt" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#F5F5F7] text-brand-gray-900 antialiased">
        {rep ? (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white/85 backdrop-blur-md border-b border-[#eee] sticky top-0 z-40">
              <div className="max-w-5xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-5 min-w-0">
                  <Link
                    href="/vadybininke"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-br from-brand-magenta to-brand-blue" />
                    <span className="font-extrabold tracking-tight text-brand-gray-900">
                      DK <span className="text-brand-magenta">Vadyba</span>
                    </span>
                  </Link>
                  <RepDesktopNav pending={pendingCount} rejected={rejectedCount} />
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/vadybininke/naujas-uzsakymas"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta-dark transition-colors shadow-[0_2px_8px_rgba(233,30,140,0.25)]"
                  >
                    <Plus size={15} strokeWidth={2.6} />
                    Naujas užsakymas
                  </Link>
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-magenta to-brand-blue text-white text-[12px] font-bold select-none"
                    title={rep.user.email ?? ''}
                  >
                    {initials}
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
              </div>
            </header>
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 pb-28 sm:pb-8">
              {children}
            </main>
            <RepMobileTabBar pending={pendingCount} rejected={rejectedCount} />
          </div>
        ) : (
          // Neprisijungęs — login puslapis turi savo visaekranio turinį
          children
        )}
      </body>
    </html>
  )
}
