'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Plus,
} from 'lucide-react'

const NAV = [
  { href: '/vadybininke', label: 'Skydelis', icon: LayoutDashboard, exact: true },
  { href: '/vadybininke/uzsakymai', label: 'Užsakymai', icon: ClipboardList },
  { href: '/vadybininke/klientai', label: 'Klientai', icon: Users },
  { href: '/vadybininke/atsargos', label: 'Atsargos', icon: Package },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href)
}

/** Desktop nav — header'io viduryje, su aktyvia būsena. */
export function RepDesktopNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden sm:flex items-center gap-0.5">
      {NAV.map((n) => {
        const active = isActive(pathname, n.href, n.exact)
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
              active
                ? 'text-brand-magenta bg-brand-magenta/8'
                : 'text-brand-gray-600 hover:bg-[#F5F5F7] hover:text-brand-gray-900'
            }`}
          >
            <n.icon size={15} strokeWidth={active ? 2.4 : 2} />
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Mobili apatinė navigacija — programėlės stiliaus juosta su centriniu „+". */
export function RepMobileTabBar() {
  const pathname = usePathname()
  const left = NAV.slice(0, 2)
  const right = NAV.slice(2)
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eee] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end h-[60px]">
        {left.map((n) => (
          <TabItem key={n.href} item={n} active={isActive(pathname, n.href, n.exact)} />
        ))}
        <div className="relative flex justify-center">
          <Link
            href="/vadybininke/naujas-uzsakymas"
            aria-label="Naujas užsakymas"
            className={`absolute -top-[26px] flex items-center justify-center w-[52px] h-[52px] rounded-full text-white shadow-[0_6px_16px_rgba(233,30,140,0.4)] active:scale-95 transition-transform ${
              pathname.startsWith('/vadybininke/naujas-uzsakymas')
                ? 'bg-brand-magenta-dark'
                : 'bg-brand-magenta'
            }`}
          >
            <Plus size={26} strokeWidth={2.6} />
          </Link>
          <span className="pb-2 text-[10px] font-semibold text-brand-gray-500">
            Naujas
          </span>
        </div>
        {right.map((n) => (
          <TabItem key={n.href} item={n} active={isActive(pathname, n.href, n.exact)} />
        ))}
      </div>
    </nav>
  )
}

function TabItem({
  item,
  active,
}: {
  item: (typeof NAV)[number]
  active: boolean
}) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center justify-end gap-0.5 pb-2 pt-2.5 text-[10px] font-semibold transition-colors ${
        active ? 'text-brand-magenta' : 'text-brand-gray-500'
      }`}
    >
      <item.icon size={21} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </Link>
  )
}
