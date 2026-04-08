import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../globals.css'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
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
      <body className="min-h-full bg-[#F5F5F7] text-brand-gray-900 antialiased">
        {user ? (
          <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex-1 ml-[260px] min-h-screen flex flex-col">
              <AdminTopbar email={user.email ?? ''} />
              <div className="flex-1 p-8">{children}</div>
            </div>
          </div>
        ) : (
          // Neprisijungęs — rodome vien tik children (login puslapis turi
          // savo visaekranio layout'ą)
          children
        )}
      </body>
    </html>
  )
}
