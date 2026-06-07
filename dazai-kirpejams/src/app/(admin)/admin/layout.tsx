import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../globals.css'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminSidebarProvider } from '@/components/admin/AdminSidebarContext'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { getAdminUser } from '@/lib/admin/auth'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Admin | Dažai Kirpėjams',
    template: '%s | DK Admin',
  },
  // Admin'as niekada neturi būti indeksuojamas
  robots: { index: false, follow: false },
}

/**
 * Visa admin zona — dinaminė. Layout'as kiekvienam užklausimui kviečia
 * `getAdminUser()` (cookies + auth per Supabase), tad statiškai prerender'inti
 * nėra ko — admin niekada nekešuojamas. Deklaruojam VIENĄ kartą čia (ne po
 * `force-dynamic` kiekviename puslapyje), kad:
 *  1) nei vienas admin puslapis (įsk. /admin/login, /naujas formas) nebūtų
 *     bandomas prerender'inti build metu → build nebepriklauso nuo build-time env;
 *  2) ateityje pridėtas naujas admin puslapis automatiškai būtų dinaminis.
 * (Tai NEpakeičia env būtinybės runtime'e — tik pašalina klaidingą build'o kritimą.)
 */
export const dynamic = 'force-dynamic'

/**
 * Admin root layout — atskiras nuo viešos svetainės (route group `(admin)`).
 * Pateikia html/body, sidebar'ą ir topbar'ą. Login puslapis (`/admin/login`)
 * turi savo nested layout'ą kuris perdengia šį (skirtingas turinys be sidebar).
 *
 * Auth: layout'as NEREDIRECT'ina jei user'io nėra — tai leidžia
 * `/admin/login` veikti po šiuo layout'u. Realų patikrinimą daro
 * `requireAdmin()` kiekvieno protected page'o pradžioje + proxy optimistinis
 * patikrinimas.
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()

  return (
    <html lang="lt" className={`${inter.variable} h-full`}>
      <body className="dk-admin min-h-full bg-[#F5F5F7] text-brand-gray-900 antialiased">
        {/* Mobilus: 16px įvesties šriftas neleidžia iOS Safari „zoom on focus"
            (kai laukas <16px, telefonas priartina ekraną pildant) + patogesnis
            tapas. Tik admin zonoje, tik ≤640px. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (max-width: 640px) {
              input:not([type=checkbox]):not([type=radio]):not([type=file]),
              select, textarea { font-size: 16px !important; }
            }`,
          }}
        />
        {user ? (
          <AdminSidebarProvider>
            <div className="flex min-h-screen">
              <AdminSidebar />
              <div className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">
                <AdminTopbar email={user.email ?? ''} />
                <div className="flex-1 p-4 lg:p-8">{children}</div>
              </div>
            </div>
          </AdminSidebarProvider>
        ) : (
          // Neprisijungęs — rodome vien tik children (login puslapis turi
          // savo visaekranio layout'ą)
          children
        )}
      </body>
    </html>
  )
}
