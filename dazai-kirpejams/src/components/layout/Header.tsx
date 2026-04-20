import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MobileMenu } from './MobileMenu'
import { HeaderCart } from './HeaderCart'
import { HeaderAuth } from './HeaderAuth'
import { langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'

type HeaderProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Header atkurtas iš originalaus HTML dizaino:
 *  - fiksuota juosta su backdrop blur
 *  - Color SHOCK logo (95px aukščio paveikslas)
 *  - nav linkai su magenta underline hover
 *  - nav-lang switcher ir nav-cart dešinėje pusėje
 */
export function Header({ lang, dict }: HeaderProps) {
  const nav = dict.nav

  const p = langPrefix(lang)
  const links = [
    { href: `${p}/produktai`, label: nav.products },
    { href: `${p}/spalvu-palete`, label: nav.colorPalette },
    { href: `${p}/salonams`, label: nav.forSalons },
    { href: `${p}/blogas`, label: nav.blog },
    { href: `${p}/apie-mus`, label: nav.about },
    { href: `${p}/kontaktai`, label: nav.contact },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/[0.97] backdrop-blur-md border-b border-[#E0E0E0]">
      <Container>
        <div className="flex items-center justify-between h-[72px] lg:h-[100px]">
          {/* Logo */}
          <Link
            href={p || '/'}
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Dažai Kirpėjams"
          >
            <Image
              src="/logo-colorshock.png"
              alt="Color SHOCK"
              width={87}
              height={80}
              sizes="80px"
              priority
              className="h-[56px] lg:h-[80px] w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-[0.95rem] font-medium text-brand-gray-900 hover:text-brand-magenta transition-colors py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-magenta after:transition-[width] hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LocaleSwitcher currentLocale={lang} />
            <HeaderAuth lang={lang} />
            <HeaderCart lang={lang} label={nav.cart} />
            <MobileMenu
              lang={lang}
              links={links}
              labels={{
                myAccount: nav.myAccount,
                login: nav.login,
                language: nav.language,
                mainMenu: nav.mainMenu,
                openMenu: nav.openMenu,
                closeMenu: nav.closeMenu,
              }}
            />
          </div>
        </div>
      </Container>
    </header>
  )
}
