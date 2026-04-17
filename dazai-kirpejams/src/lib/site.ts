/**
 * Centriniai svetainės kontaktai ir rekvizitai.
 *
 * Visos vietos (Footer, Kontaktai, DUK, Salonams, Pristatymas, Schema) turi
 * importuoti iš čia, kad pakeitimai vyktų vienoje vietoje.
 */

type Contact = {
  email: string
  phone: string
  phone2: string
  address: string
  street: string
  city: string
  postalCode: string
  country: string
  workingHours: string
}

export const CONTACT: Contact = {
  email: 'info@dazaikirpejams.lt',
  phone: '+370 680 47667',
  phone2: '+370 607 97847',
  street: 'Taikos pr. 32',
  city: 'Kaunas',
  postalCode: 'LT-50246',
  country: 'LT',
  address: 'Taikos pr. 32, LT-50246 Kaunas, Lietuva',
  workingHours: 'I–V: 9:00 – 18:00',
}

export const COMPANY = {
  legalName: 'Džiuljetos Vėbrės individuali veikla',
  code: '47003130637',
  vatPayer: false,
} as const

/** `tel:` link'ui — be tarpų */
export const phoneHref = `tel:${CONTACT.phone.replace(/\s+/g, '')}`
export const phone2Href = `tel:${CONTACT.phone2.replace(/\s+/g, '')}`

export const SOCIAL = {
  facebook: 'https://www.facebook.com/dazaikirpejams',
  instagram: 'https://www.instagram.com/dazaikirpejams',
} as const
