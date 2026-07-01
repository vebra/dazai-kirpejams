import { describe, it, expect } from 'vitest'
import {
  buildCustomerOrderEmail,
  buildStatusChangeEmail,
  buildInvoicePaidEmail,
} from './templates'

type Input = Parameters<typeof buildCustomerOrderEmail>[0]

function makeInput(overrides: Partial<Input> = {}): Input {
  return {
    orderNumber: 'DK-260520-160345',
    firstName: 'Marius',
    lastName: 'Vebra',
    email: 'klientas@pavyzdys.lt',
    phone: '+37060000000',
    deliveryMethod: 'parcel_locker',
    deliveryAddress: 'LP EXPRESS, Kauno paštomatas',
    deliveryCity: 'Kaunas',
    deliveryPostalCode: 'LT-44001',
    paymentMethod: 'bank_transfer',
    items: [
      { name: 'Color SHOCK 9.0', quantity: 2, unitPriceCents: 699 },
      { name: 'Oksidantas 6%', quantity: 1, unitPriceCents: 599 },
    ],
    subtotalCents: 1997,
    shippingCents: 299,
    vatCents: 0,
    totalCents: 2296,
    createdAt: '2026-05-20T15:06:00.000Z',
    siteUrl: 'https://www.dazaikirpejams.lt',
    ...overrides,
  }
}

const FULL_COMPANY = {
  legalName: 'Džiuljeta Vėbrė IDV',
  address: 'Taikos pr. 32, Kaunas',
  email: 'info@dziuljetavebre.lt',
  phone: '+37068047667',
  bankRecipient: 'Džiuljeta Vėbrė',
  bankIban: 'LT91 7044 0006 7461 3578',
  bankName: 'SEB',
}

describe('buildCustomerOrderEmail — subject ir bendra struktūra', () => {
  it('subject turi užsakymo numerį', () => {
    const r = buildCustomerOrderEmail(makeInput())
    expect(r.subject).toContain('DK-260520-160345')
  })

  it('HTML rodo prekių pavadinimus ir kiekius', () => {
    const r = buildCustomerOrderEmail(makeInput())
    expect(r.html).toContain('Color SHOCK 9.0')
    expect(r.html).toContain('× 2')
    expect(r.html).toContain('Oksidantas 6%')
  })

  it('HTML rodo galutinę sumą', () => {
    const r = buildCustomerOrderEmail(makeInput({ totalCents: 2296 }))
    expect(r.html).toMatch(/22[,.]96/)
  })

  it('text variantas turi užsakymo numerį ir galutinę sumą', () => {
    const r = buildCustomerOrderEmail(makeInput())
    expect(r.text).toContain('DK-260520-160345')
    expect(r.text).toMatch(/22[,.]96/)
  })

  it('apsaugo (escape) pavojingą firstName — XSS prevencija', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ firstName: '<script>alert(1)</script>' })
    )
    expect(r.html).not.toContain('<script>alert(1)</script>')
    expect(r.html).toContain('&lt;script&gt;')
  })
})

describe('buildCustomerOrderEmail — pristatymas', () => {
  it('rodo „Nemokamas" kai shippingCents === 0', () => {
    const r = buildCustomerOrderEmail(makeInput({ shippingCents: 0 }))
    expect(r.html).toContain('Nemokamas')
  })

  it('rodo pristatymo kainą kai > 0', () => {
    const r = buildCustomerOrderEmail(makeInput({ shippingCents: 299 }))
    expect(r.html).toMatch(/2[,.]99/)
  })
})

describe('buildCustomerOrderEmail — PVM eilutė', () => {
  it('rodoma kai vatCents > 0 (PVM mokėtojas)', () => {
    const r = buildCustomerOrderEmail(makeInput({ vatCents: 420 }))
    expect(r.html).toContain('PVM')
  })

  it('paslepta kai vatCents === 0 (ne PVM mokėtojas)', () => {
    const r = buildCustomerOrderEmail(makeInput({ vatCents: 0 }))
    expect(r.html).not.toContain('PVM (21%)')
  })
})

describe('buildCustomerOrderEmail — nuolaidos eilutė', () => {
  it('rodoma su kupono kodu kai discountCents > 0', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ discountCents: 500, discountCode: 'PAVASARIS' })
    )
    expect(r.html).toContain('Nuolaida')
    expect(r.html).toContain('PAVASARIS')
  })

  it('paslepta kai discountCents === 0 arba neperduota', () => {
    const r = buildCustomerOrderEmail(makeInput({ discountCents: 0 }))
    expect(r.html).not.toContain('Nuolaida')
  })
})

describe('buildCustomerOrderEmail — banko pavedimo blokas', () => {
  it('rodo pilną IBAN bloką kai bank_transfer + sukonfigūruoti rekvizitai', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ paymentMethod: 'bank_transfer', company: FULL_COMPANY })
    )
    expect(r.html).toContain('Banko pavedimas')
    expect(r.html).toContain('LT91 7044 0006 7461 3578')
    expect(r.html).toContain('Džiuljeta Vėbrė')
    expect(r.html).toContain('SEB')
    // Mokėjimo paskirtyje turi būti užsakymo numeris
    expect(r.html).toContain('DK-260520-160345')
  })

  it('rodo fallback žinutę kai bank_transfer bet trūksta IBAN', () => {
    const r = buildCustomerOrderEmail(
      makeInput({
        paymentMethod: 'bank_transfer',
        company: { ...FULL_COMPANY, bankIban: '' },
      })
    )
    expect(r.html).toContain('atskiru laišku')
    expect(r.html).not.toContain('LT91 7044')
  })

  it('rodo fallback kai company visai neperduota', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ paymentMethod: 'bank_transfer', company: undefined })
    )
    expect(r.html).toContain('atskiru laišku')
  })

  it('paslepia visą bloką kai paymentMethod = paysera', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ paymentMethod: 'paysera', company: FULL_COMPANY })
    )
    expect(r.html).not.toContain('Banko pavedimas')
    expect(r.html).not.toContain('atskiru laišku')
  })

  it('paslepia visą bloką kai paymentMethod = stripe', () => {
    const r = buildCustomerOrderEmail(
      makeInput({ paymentMethod: 'stripe', company: FULL_COMPANY })
    )
    expect(r.html).not.toContain('Banko pavedimas')
  })
})

describe('buildCustomerOrderEmail — magic-link „Peržiūrėti užsakymą"', () => {
  const MAGIC = 'https://www.dazaikirpejams.lt/uzsakymas/DK-1?token=abc.def'

  it('rodomas kai viewOrderUrl perduotas', () => {
    const r = buildCustomerOrderEmail(makeInput({ viewOrderUrl: MAGIC }))
    expect(r.html).toContain('Peržiūrėti užsakymą')
    expect(r.html).toContain(MAGIC)
    expect(r.text).toContain(MAGIC)
  })

  it('paslėptas kai viewOrderUrl null', () => {
    const r = buildCustomerOrderEmail(makeInput({ viewOrderUrl: null }))
    expect(r.html).not.toContain('Peržiūrėti užsakymą')
  })

  it('paslėptas kai viewOrderUrl neperduotas', () => {
    const r = buildCustomerOrderEmail(makeInput({}))
    expect(r.html).not.toContain('Peržiūrėti užsakymą')
  })
})

// ============================================
// Statuso laiškų lokalizacija (LT/EN/RU)
// ============================================

type StatusInput = Parameters<typeof buildStatusChangeEmail>[0]

function makeStatusInput(overrides: Partial<StatusInput> = {}): StatusInput {
  return {
    orderNumber: 'DK-260520-160345',
    firstName: 'Marius',
    status: 'shipped',
    trackingNumber: 'LP123456789LT',
    trackingCarrier: 'lp_express',
    siteUrl: 'https://www.dazaikirpejams.lt',
    ...overrides,
  }
}

describe('buildStatusChangeEmail — lokalizacija', () => {
  it('be lang — lietuviškas (atgalinis suderinamumas)', () => {
    const r = buildStatusChangeEmail(makeStatusInput())
    expect(r.subject).toContain('išsiųstas')
    expect(r.html).toContain('<html lang="lt">')
  })

  it('shipped EN — angliškas subject, tracking blokas ir lang atributas', () => {
    const r = buildStatusChangeEmail(makeStatusInput({ lang: 'en' }))
    expect(r.subject).toBe('Your order DK-260520-160345 has been shipped')
    expect(r.subject).not.toContain('išsiųstas')
    expect(r.html).toContain('<html lang="en">')
    expect(r.html).toContain('Tracking number')
    expect(r.html).toContain('LP123456789LT')
    expect(r.text).toContain('Track shipment:')
  })

  it('shipped RU — rusiškas subject ir tracking etiketė', () => {
    const r = buildStatusChangeEmail(makeStatusInput({ lang: 'ru' }))
    expect(r.subject).toBe('Ваш заказ DK-260520-160345 отправлен')
    expect(r.html).toContain('<html lang="ru">')
    expect(r.html).toContain('Номер для отслеживания')
  })

  it('delivered EN — nuorodos su /en/ prefiksu', () => {
    const r = buildStatusChangeEmail(
      makeStatusInput({ status: 'delivered', lang: 'en' })
    )
    expect(r.subject).toContain('delivered')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/en/paskyra')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/en/produktai')
    expect(r.html).not.toContain('/lt/paskyra')
  })

  it('delivered RU — nuorodos su /ru/ prefiksu', () => {
    const r = buildStatusChangeEmail(
      makeStatusInput({ status: 'delivered', lang: 'ru' })
    )
    expect(r.subject).toContain('доставлен')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/ru/paskyra')
    expect(r.text).toContain('https://www.dazaikirpejams.lt/ru/produktai')
  })

  it('delivered be lang — /lt/ nuorodos kaip anksčiau', () => {
    const r = buildStatusChangeEmail(makeStatusInput({ status: 'delivered' }))
    expect(r.subject).toContain('pristatytas')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/lt/paskyra')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/lt/produktai')
  })

  it('cancelled EN/RU — lokalizuotas subject ir grąžinimo terminas', () => {
    const en = buildStatusChangeEmail(
      makeStatusInput({ status: 'cancelled', lang: 'en' })
    )
    expect(en.subject).toBe('Your order DK-260520-160345 has been cancelled')
    expect(en.html).toContain('5 business days')

    const ru = buildStatusChangeEmail(
      makeStatusInput({ status: 'cancelled', lang: 'ru' })
    )
    expect(ru.subject).toBe('Ваш заказ DK-260520-160345 отменён')
    expect(ru.html).toContain('5 рабочих дней')
  })

  it('apsaugo (escape) pavojingą firstName visose kalbose', () => {
    for (const lang of ['lt', 'en', 'ru'] as const) {
      const r = buildStatusChangeEmail(
        makeStatusInput({ firstName: '<script>alert(1)</script>', lang })
      )
      expect(r.html).not.toContain('<script>alert(1)</script>')
    }
  })
})

// ============================================
// Sąskaitos laiško lokalizacija (LT/EN/RU)
// ============================================

type InvoiceInput = Parameters<typeof buildInvoicePaidEmail>[0]

function makeInvoiceInput(overrides: Partial<InvoiceInput> = {}): InvoiceInput {
  return {
    orderNumber: 'DK-260520-160345',
    invoiceNumber: 'DK-INV-0042',
    firstName: 'Marius',
    totalCents: 2296,
    isVatInvoice: true,
    siteUrl: 'https://www.dazaikirpejams.lt',
    accountUrl: 'https://www.dazaikirpejams.lt/lt/paskyra',
    ...overrides,
  }
}

describe('buildInvoicePaidEmail — lokalizacija', () => {
  it('be lang — lietuviškas (atgalinis suderinamumas)', () => {
    const r = buildInvoicePaidEmail(makeInvoiceInput())
    expect(r.subject).toBe('PVM sąskaita faktūra DK-INV-0042 — Dažai Kirpėjams')
    expect(r.html).toContain('<html lang="lt">')
    expect(r.html).toContain('Sąskaitos numeris')
  })

  it('EN — angliškas subject, VAT invoice ir accountUrl', () => {
    const r = buildInvoicePaidEmail(
      makeInvoiceInput({
        lang: 'en',
        accountUrl: 'https://www.dazaikirpejams.lt/en/paskyra',
      })
    )
    expect(r.subject).toBe('VAT invoice DK-INV-0042 — Dažai Kirpėjams')
    expect(r.subject).not.toContain('sąskaita')
    expect(r.html).toContain('<html lang="en">')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/en/paskyra')
    expect(r.html).toContain('Invoice number')
    expect(r.text).toContain('Thank you for your payment')
  })

  it('EN — ne PVM variantas be „VAT"', () => {
    const r = buildInvoicePaidEmail(
      makeInvoiceInput({ lang: 'en', isVatInvoice: false })
    )
    expect(r.subject).toBe('Invoice DK-INV-0042 — Dažai Kirpėjams')
  })

  it('RU — rusiškas subject ir turinys', () => {
    const r = buildInvoicePaidEmail(
      makeInvoiceInput({
        lang: 'ru',
        accountUrl: 'https://www.dazaikirpejams.lt/ru/paskyra',
      })
    )
    expect(r.subject).toBe('Счёт-фактура с НДС DK-INV-0042 — Dažai Kirpėjams')
    expect(r.html).toContain('<html lang="ru">')
    expect(r.html).toContain('https://www.dazaikirpejams.lt/ru/paskyra')
    expect(r.html).toContain('Номер счёта')
    expect(r.text).toContain('Спасибо за оплату')
  })
})
