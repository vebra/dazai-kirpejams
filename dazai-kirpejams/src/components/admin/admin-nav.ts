/**
 * Bendras admin navigacijos sąrašas — naudoja ir AdminSidebar (nuorodos),
 * ir AdminTopbar (aktyvaus puslapio titulas).
 *
 * Eilė atitinka HTML dizaino dashboard.html sidebar'o tvarką.
 */

export type AdminNavItem = {
  href: string
  label: string
  /** Emoji ikonėlė iš HTML dizaino */
  icon: string
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Apžvalga', icon: '📊' },
  { href: '/admin/uzsakymai', label: 'Užsakymai', icon: '📦' },
  { href: '/admin/patvirtinimai', label: 'Patvirtinimai', icon: '🕓' },
  { href: '/admin/vadybininkes', label: 'Vadybininkės', icon: '👩‍💼' },
  { href: '/admin/sandelis', label: 'Sandėlis', icon: '📋' },
  { href: '/admin/klientai', label: 'Klientai', icon: '👥' },
  { href: '/admin/kainos', label: 'Kainos ir nuolaidos', icon: '💰' },
  { href: '/admin/didmenos-kainos', label: 'Didmeninės kainos', icon: '🏷️' },
  { href: '/admin/nustatymai', label: 'Nustatymai', icon: '⚙️' },
  { href: '/admin/ataskaitos', label: 'Ataskaitos', icon: '📈' },
  { href: '/admin/blogas', label: 'Blogas', icon: '✏️' },
  { href: '/admin/baneriai', label: 'Baneriai', icon: '🖼️' },
  { href: '/admin/b2b', label: 'B2B užklausos', icon: '🤝' },
  { href: '/admin/renginiai', label: 'Renginiai', icon: '🎤' },
  { href: '/admin/verifikacija', label: 'Verifikacija', icon: '✅' },
  { href: '/admin/naujienlaiskiai', label: 'Naujienlaiškiai', icon: '📧' },
  { href: '/admin/kampanijos', label: 'Kampanijos', icon: '📨' },
]
