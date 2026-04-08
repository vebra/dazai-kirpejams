'use client'

import { usePathname } from 'next/navigation'
import { ADMIN_NAV } from './admin-nav'

/**
 * Admin topbar — sticky antraštė. Puslapio titulą suranda pagal pathname'ą
 * iš bendro `ADMIN_NAV` sąrašo (nesukuriam atskiros label → title logikos).
 */

type Props = {
  email: string
}

function resolveTitle(pathname: string): string {
  // Ilgiausiai atitinkantis prefix'as (kad /admin/uzsakymai/123 → „Užsakymai")
  const sorted = [...ADMIN_NAV].sort((a, b) => b.href.length - a.href.length)
  for (const item of sorted) {
    if (item.href === '/admin' && pathname === '/admin') return item.label
    if (item.href !== '/admin' && pathname.startsWith(item.href)) {
      return item.label
    }
  }
  return 'Admin'
}

export function AdminTopbar({ email }: Props) {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="sticky top-0 z-[50] bg-white border-b border-[#eee] px-8 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold text-brand-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative text-xl cursor-pointer" aria-label="Pranešimai">
          <span>🔔</span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </div>
        <span className="text-[13px] font-medium text-brand-gray-500">
          {email}
        </span>
      </div>
    </header>
  )
}
