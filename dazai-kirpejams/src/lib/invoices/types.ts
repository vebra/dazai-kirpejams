/**
 * Sąskaitos faktūros duomenų tipai. Visi „snapshot" tipai atitinka JSON,
 * saugomą invoices.seller_snapshot / buyer_snapshot / items_snapshot
 * kolonose. Jie sąmoningai plokšti — PDF šablonas turi veikti iš vieno
 * objekto be papildomų DB užklausų.
 */

export type InvoiceSellerSnapshot = {
  legalName: string
  regCode: string
  vatCode: string
  address: string
  email: string
  phone: string
  bankRecipient: string
  bankIban: string
  bankName: string
}

export type InvoiceBuyerSnapshot = {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  // B2B laukai — null jei fizinis asmuo
  companyName: string | null
  companyCode: string | null
  vatCode: string | null
  // Pristatymo/sąskaitos adresas
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
}

export type InvoiceLineItem = {
  name: string
  sku: string | null
  quantity: number
  unitPriceCents: number
  totalCents: number
}

/**
 * Brand'o snapshot — dizaino/teksto nustatymai, kuriuos admin'as gali
 * keisti per /admin/nustatymai. Užfiksuojami sąskaitoje išrašymo momentu,
 * kad vėlesnis brand'o keitimas nepakeistų jau išrašytų sąskaitų.
 */
export type InvoiceBrandSnapshot = {
  brandName: string
  tagline: string
  accentColor: string // HEX
  footerText: string
  defaultNotes: string
}

/**
 * Default'ai, naudojami kai brand'o nustatymai neužpildyti (arba
 * sąskaita buvo išrašyta prieš įdiegiant template customization).
 */
export const INVOICE_BRAND_DEFAULTS: InvoiceBrandSnapshot = {
  brandName: 'Dažai Kirpėjams',
  tagline: 'Profesionalūs plaukų dažai kirpėjams',
  accentColor: '#E91E8C',
  footerText: '',
  defaultNotes: '',
}

export const DEFAULT_PAYMENT_TERMS_DAYS = 14

/**
 * Pilnas sąskaitos duomenų rinkinys — būtent šį objektą priima PDF
 * šablonas. Jis gali ateiti iš DB (jau išrašyta sąskaita) arba iš
 * in-memory prepare'ingo (preview'as prieš rašant į DB).
 */
export type InvoiceData = {
  invoiceNumber: string
  issuedAt: string // ISO string
  orderNumber: string

  seller: InvoiceSellerSnapshot
  buyer: InvoiceBuyerSnapshot
  items: InvoiceLineItem[]
  brand: InvoiceBrandSnapshot

  subtotalCents: number
  discountCents: number
  deliveryCostCents: number
  vatCents: number
  vatRate: number // pvz. 21.00
  totalCents: number

  // Pastabos po lentele — mokėjimo rekvizitai generuojami iš seller
  paymentMethod: string
  notes: string | null

  // ISO yyyy-MM-dd. Null — sąskaita mokėtina iš karto (cash/Paysera/Stripe).
  paymentDueDate: string | null
}
