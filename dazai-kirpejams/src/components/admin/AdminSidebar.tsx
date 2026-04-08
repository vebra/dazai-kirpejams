'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ADMIN_NAV } from './admin-nav'

/**
 * Admin sidebar — atitinka HTML dizaino (dashboard.html) sekcijas:
 * juodas fonas, magenta active border, 11 nav item'ų + Atsijungti apačioje.
 */

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-[100] w-[260px] bg-[#1A1A1A] text-white flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.08]">
        <h2 className="text-xl font-extrabold text-brand-magenta leading-none">
          DK Admin
        </h2>
        <span className="block mt-1 text-[11px] uppercase tracking-[1px] text-[#6B6B6B]">
          Valdymo panelė
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const active = isItemActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-5 py-3 text-sm font-medium
                border-l-[3px] transition-colors
                ${
                  active
                    ? 'text-white bg-brand-magenta/10 border-brand-magenta'
                    : 'text-[#999] border-transparent hover:text-white hover:bg-white/[0.04]'
                }
              `}
            >
              <span className="text-lg w-6 text-center" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — Logout */}
      <div className="px-5 py-4 border-t border-white/[0.08]">
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 py-2 text-sm font-medium text-[#EF4444] hover:text-red-400 transition-colors w-full"
          >
            <span className="text-lg w-6 text-center" aria-hidden>
              🚪
            </span>
            Atsijungti
          </button>
        </form>
      </div>
    </aside>
  )
}
