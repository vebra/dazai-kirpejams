import { describe, it, expect } from 'vitest'
import { buildCustomerOrderEmail } from './templates'

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
