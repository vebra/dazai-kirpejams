import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { CONTACT, phoneHref, SOCIAL } from '@/lib/site'
import { TrackedContactLink } from '@/components/analytics/TrackedContactLink'

type FooterProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Footer atkurtas iš originalaus HTML dizaino:
 *  - juodas fonas, 4 stulpelių tinklelis 1.5fr 1fr 1fr 1fr
 *  - brand stulpelyje: logo, aprašymas ir social apskritimai
 *  - kontaktų stulpelyje: email, telefonas, adresas su simboliais
 *  - apatinė juosta su copyright ir teisinėmis nuorodomis
 */
export function Footer({ lang, dict }: FooterProps) {
  const nav = dict.nav
  const footer = dict.footer
  const common = dict.common

  const p = langPrefix(lang)
  const products = [
    { href: `${p}/produktai/dazai`, label: nav.hairDyes },
    { href: `${p}/produktai/oksidantai`, label: nav.oxidants },
    { href: `${p}/produktai/sampunai`, label: nav.shampoos },
    { href: `${p}/produktai/priemones`, label: nav.accessories },
    { href: `${p}/spalvu-palete`, label: nav.colorPalette },
  ]

  const information = [
    { href: `${p}/apie-mus`, label: nav.about },
    { href: `${p}/blogas`, label: nav.blog },
    { href: `${p}/salonams`, label: footer.collaboration },
    { href: `${p}/duk`, label: footer.faq },
    { href: `${p}/pristatymas`, label: footer.delivery },
    { href: `${p}/skaiciuokle`, label: footer.calculator },
  ]

  return (
    <footer id="kontaktai" className="bg-brand-gray-900 text-white/70 pt-[60px]">
      <Container>
        {/* Pagrindinis 4-col tinklelis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
          {/* Brand stulpelis */}
          <div>
            <Link
              href={p || '/'}
              className="inline-flex items-center"
              aria-label="Dažai Kirpėjams"
            >
              <Image
                src="/logo-colorshock.png"
                alt="Color SHOCK"
                width={600}
                height={554}
                className="h-[90px] w-auto bg-white rounded-lg p-2"
              />
            </Link>
            <p className="text-[0.9rem] text-white/55 mt-4 leading-[1.7]">
              {footer.brandDescription}
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href={SOCIAL.facebook}
                title="Facebook"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:bg-brand-magenta hover:border-brand-magenta hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a
                href={SOCIAL.instagram}
                title="Instagram"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:bg-brand-magenta hover:border-brand-magenta hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.849.07 1.366.062 2.633.332 3.608 1.308.975.975 1.246 2.242 1.308 3.608.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.062 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.265.058-1.645.069-4.849.069-3.204 0-3.584-.012-4.849-.069-1.366-.062-2.633-.333-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12c0-3.204.012-3.584.07-4.849.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.142 0-3.513.011-4.754.068-1.02.047-1.583.22-1.954.365-.491.191-.843.42-1.212.789-.369.369-.598.721-.789 1.212-.145.371-.318.934-.365 1.954-.057 1.241-.068 1.612-.068 4.754s.011 3.513.068 4.754c.047 1.02.22 1.583.365 1.954.191.491.42.843.789 1.212.369.369.721.598 1.212.789.371.145.934.318 1.954.365 1.241.057 1.612.068 4.754.068 3.142 0 3.513-.011 4.754-.068 1.02-.047 1.583-.22 1.954-.365.491-.191.843-.42 1.212-.789.369-.369.598-.721.789-1.212.145-.371.318-.934.365-1.954.057-1.241.068-1.612.068-4.754s-.011-3.513-.068-4.754c-.047-1.02-.22-1.583-.365-1.954-.191-.491-.42-.843-.789-1.212-.369-.369-.721-.598-1.212-.789-.371-.145-.934-.318-1.954-.365C15.513 4.012 15.142 4.001 12 4.001zm0 3.13a4.869 4.869 0 110 9.738 4.869 4.869 0 010-9.738zm0 8.03a3.162 3.162 0 100-6.324 3.162 3.162 0 000 6.324zm6.189-8.235a1.138 1.138 0 11-2.276 0 1.138 1.138 0 012.276 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Produktai */}
          <div>
            <h4 className="text-[0.95rem] font-bold uppercase tracking-wider text-white mb-5">
              {footer.products}
            </h4>
            <ul>
              {products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center min-h-[44px] py-2 text-[0.9rem] text-white/60 hover:text-brand-magenta transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informacija */}
          <div>
            <h4 className="text-[0.95rem] font-bold uppercase tracking-wider text-white mb-5">
              {footer.information}
            </h4>
            <ul>
              {information.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center min-h-[44px] py-2 text-[0.9rem] text-white/60 hover:text-brand-magenta transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontaktai */}
          <div>
            <h4 className="text-[0.95rem] font-bold uppercase tracking-wider text-white mb-5">
              {footer.contacts}
            </h4>
            <ul className="text-[0.9rem] text-white/70">
              <li>
                <TrackedContactLink
                  kind="email"
                  href={`mailto:${CONTACT.email}`}
                  location="footer"
                  locale={lang}
                  className="flex items-center gap-2 min-h-[44px] py-2 hover:text-brand-magenta transition-colors"
                >
                  <span aria-hidden>✉</span>
                  {CONTACT.email}
                </TrackedContactLink>
              </li>
              {CONTACT.phone && (
                <li>
                  <TrackedContactLink
                    kind="phone"
                    href={phoneHref}
                    location="footer"
                    locale={lang}
                    className="flex items-center gap-2 min-h-[44px] py-2 hover:text-brand-magenta transition-colors"
                  >
                    <span aria-hidden>☎</span>
                    {CONTACT.phone}
                  </TrackedContactLink>
                </li>
              )}
              <li className="flex items-center gap-2 py-2">
                <span aria-hidden>📍</span>
                {common.addressDisplay}
              </li>
              <li className="text-[0.8rem] text-white/50 mt-2">
                {common.workingHoursDisplay}
              </li>
            </ul>
          </div>
        </div>

        {/* Apatinė juosta */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[0.82rem] text-white/60">
          <span>
            © {new Date().getFullYear()} Dažai Kirpėjams. {footer.rights}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={`${p}/privatumo-politika`}
              className="hover:text-brand-magenta transition-colors"
            >
              {footer.privacy}
            </Link>
            <span aria-hidden>•</span>
            <Link
              href={`${p}/pirkimo-salygos`}
              className="hover:text-brand-magenta transition-colors"
            >
              {footer.terms}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
