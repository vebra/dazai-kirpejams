/**
 * Centriniai svetainės kontaktai.
 *
 * Visos vietos (Footer, Kontaktai, DUK, Salonams, Pristatymas) turi importuoti
 * iš čia, kad pakeitimai vyktų vienoje vietoje.
 *
 * TODO prieš go-live: užpildyti realų telefono numerį. Kol CONTACT.phone
 * yra tuščia eilutė — UI komponentai automatiškai slėps telefono liniją.
 */

type Contact = {
  email: string
  /** Palikti tuščią kol gausime realų numerį. Pvz. '+370 612 34567'. Kai tuščia — UI slepia telefono linijas. */
  phone: string
  address: string
  workingHours: string
}

export const CONTACT: Contact = {
  email: 'info@dazaikirpejams.lt',
  phone: '',
  address: 'Kaunas, Lietuva',
  workingHours: 'I–V: 9:00 – 18:00',
}

/** `tel:` link'ui — be tarpų */
export const phoneHref = CONTACT.phone
  ? `tel:${CONTACT.phone.replace(/\s+/g, '')}`
  : ''
