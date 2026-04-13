'use client'

import { usePathname } from 'next/navigation'
import { ADMIN_NAV } from './admin-nav'
import { useAdminSidebar } from './AdminSidebarContext'

type Props = {
  email: string
}

function resolveTitle(pathname: string): string {
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
  const { toggle } = useAdminSidebar()

  return (
    <header className="sticky top-0 z-[50] bg-white border-b border-[#eee] px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Hamburger — tik mobile */}
        <button
          type="button"
          onClick={toggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center text-brand-gray-900 hover:text-brand-magenta transition-colors"
          aria-label="Atidaryti meniu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-brand-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative text-xl cursor-pointer" aria-label="Pranešimai">
          <span>🔔</span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </div>
        <span className="hidden sm:inline text-[13px] font-medium text-brand-gray-500">
          {email}
        </span>
      </div>
    </header>
  )
}
