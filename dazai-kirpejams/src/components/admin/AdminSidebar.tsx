'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ADMIN_NAV } from './admin-nav'
import { useAdminSidebar } from './AdminSidebarContext'

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { open, close } = useAdminSidebar()

  // Uždaryti sidebar kai keičiasi route
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[100] w-[260px] bg-[#1A1A1A] text-white flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-magenta leading-none">
              DK Admin
            </h2>
            <span className="block mt-1 text-[11px] uppercase tracking-[1px] text-[#6B6B6B]">
              Valdymo panelė
            </span>
          </div>
          {/* Close mygtukas mobile */}
          <button
            type="button"
            onClick={close}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Uždaryti meniu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
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
    </>
  )
}
