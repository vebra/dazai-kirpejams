/**
 * Analytics payload tipai. Visa centralizuota tracking'o sistema naudoja
 * šiuos tipus — niekur UI kode neturi būti bare objektų su `any` ar
 * laisvomis reikšmėmis.
 */

export type CurrencyCode = 'EUR' | 'USD' | 'GBP'
export type LocaleCode = 'lt' | 'en' | 'ru'
export type LeadType = 'b2b' | 'contact'
export type UserType = 'guest' | 'professional'
export type PackSize = '180ml' | 'other'
export type SubscribeSource = 'newsletter' | 'footer' | 'popup'

export type ViewContentPayload = {
  productId: string
  name: string
  category: string
  price?: number
  currency?: CurrencyCode
  locale?: LocaleCode
  userType?: UserType
  packSize?: PackSize
}

export type PriceViewPayload = {
  productId: string
  name: string
  category: string
  price: number
  currency: CurrencyCode
  locale?: LocaleCode
  packSize?: PackSize
}

export type PriceUnlockContext = {
  productId?: string
  category?: string
  source: 'login' | 'register'
  locale?: LocaleCode
}

export type AddToCartPayload = {
  productId: string
  name: string
  category?: string
  price: number
  quantity: number
  currency: CurrencyCode
  locale?: LocaleCode
  userType?: UserType
  packSize?: PackSize
}

export type CheckoutItem = {
  productId: string
  name: string
  quantity: number
  price: number
  category?: string
  packSize?: PackSize
}

export type ViewCartPayload = {
  items: CheckoutItem[]
  value: number
  currency: CurrencyCode
  locale?: LocaleCode
  userType?: UserType
}

export type BeginCheckoutPayload = {
  items: CheckoutItem[]
  value: number
  currency: CurrencyCode
  locale?: LocaleCode
  userType?: UserType
}

export type PurchasePayload = {
  orderNumber: string
  items: CheckoutItem[]
  value: number
  currency: CurrencyCode
  shipping?: number
  tax?: number
  locale?: LocaleCode
  userType?: UserType
}

export type LeadPayload = {
  leadType: LeadType
  locale?: LocaleCode
  userType?: UserType
}

export type RegistrationContext = {
  businessType?: 'hairdresser' | 'salon' | 'other'
  locale?: LocaleCode
}

export type LoginContext = {
  locale?: LocaleCode
}

export type SubscribePayload = {
  source: SubscribeSource
  locale?: LocaleCode
}

export type ContactClickContext = {
  location:
    | 'header'
    | 'footer'
    | 'contact_page'
    | 'product_page'
    | 'whatsapp_float'
    | 'other'
  locale?: LocaleCode
}

export type CalculatorContext = {
  dyeingsPerWeek?: number
  mlPerDyeing?: number
  savingsPerMonth?: number
  locale?: LocaleCode
}
