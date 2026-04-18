import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { CONTACT, phoneHref } from '@/lib/site'

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
              {[
                { href: 'https://www.facebook.com/dazaikirpejams', label: 'Facebook', icon: 'f' },
                { href: 'https://www.instagram.com/dazaikirpejams', label: 'Instagram', icon: 'ig' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  title={social.label}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-base text-white/70 hover:bg-brand-magenta hover:border-brand-magenta hover:text-white transition-colors"
                >
                  {social.icon}
                </a>
              ))}
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
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-2 min-h-[44px] py-2 hover:text-brand-magenta transition-colors"
                >
                  <span aria-hidden>✉</span>
                  {CONTACT.email}
                </a>
              </li>
              {CONTACT.phone && (
                <li>
                  <a
                    href={phoneHref}
                    className="flex items-center gap-2 min-h-[44px] py-2 hover:text-brand-magenta transition-colors"
                  >
                    <span aria-hidden>☎</span>
                    {CONTACT.phone}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2 py-2">
                <span aria-hidden>📍</span>
                {CONTACT.address}
              </li>
              <li className="text-[0.8rem] text-white/50 mt-2">
                {CONTACT.workingHours}
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
