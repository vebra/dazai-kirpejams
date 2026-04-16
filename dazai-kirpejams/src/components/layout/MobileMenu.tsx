'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogIn } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { langPrefix } from '@/lib/utils'
import { LocaleSwitcher } from './LocaleSwitcher'
import type { Locale } from '@/i18n/config'

type MobileMenuProps = {
  lang: Locale
  links: { href: string; label: string }[]
}

export function MobileMenu({ lang, links }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Uždarom meniu kai pakeičiamas route'as
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Blokuojam body scroll kai meniu atidarytas
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Auth state
  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  // ESC klavišas uždarinimui
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const overlay = (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-brand-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Pagrindinis meniu"
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-[70] w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-brand-gray-50">
          <Link
            href={langPrefix(lang) || '/'}
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
            onClick={() => setOpen(false)}
          >
            <span className="text-brand-gray-900">Dažai</span>
            <span className="text-brand-magenta">Kirpėjams</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-brand-gray-900 hover:text-brand-magenta transition-colors"
            aria-label="Uždaryti meniu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-6 py-8">
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== (langPrefix(lang) || '/') && pathname.startsWith(link.href))
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-magenta/10 text-brand-magenta'
                        : 'text-brand-gray-900 hover:bg-brand-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Auth link */}
        <div className="px-6 py-4 border-t border-brand-gray-50">
          {isLoggedIn ? (
            <Link
              href={`${langPrefix(lang)}/paskyra`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-brand-gray-900 hover:bg-brand-gray-50 transition-colors"
            >
              <User className="w-5 h-5" />
              Mano paskyra
            </Link>
          ) : (
            <Link
              href={`${langPrefix(lang)}/prisijungimas`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-brand-magenta hover:bg-brand-magenta/10 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Prisijungti
            </Link>
          )}
        </div>

        {/* Footer — kalbos */}
        <div className="px-6 py-6 border-t border-brand-gray-50">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-gray-500 mb-3">
            Kalba
          </div>
          <LocaleSwitcher currentLocale={lang} variant="mobile" />
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-brand-gray-900 hover:text-brand-magenta transition-colors"
        aria-label="Atidaryti meniu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  )
}
