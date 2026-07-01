'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Truck,
  Package,
  Building2,
  Banknote,
  Tag,
  X,
  Lock,
  RotateCcw,
  HeadphonesIcon,
} from 'lucide-react'
import { useCartStore } from '@/lib/commerce/cart-store'
import { useRefreshCartPrices } from '@/lib/commerce/useRefreshCartPrices'
import {
  calculateOrderTotals,
  meetsMinimumOrder,
  DEFAULT_SHIPPING_SETTINGS,
  type ShippingSettings,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/lib/commerce/constants'
import { formatPrice, langPrefix } from '@/lib/utils'
import { createOrder } from '@/lib/commerce/order-actions'
import { OmnivaLockerPicker } from '@/components/commerce/OmnivaLockerPicker'
import { validateDiscountCodeAction } from '@/lib/commerce/discount-actions'
import type { Locale } from '@/i18n/config'

type CheckoutFormPrefill = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  salonName?: string
  companyCode?: string
  /** Jei salonName arba companyCode užpildyti — pažymim „Perku įmonės vardu". */
  isCompany?: boolean
  /** Paskutinio užsakymo pristatymo pasirinkimas — iš user_profiles.last_delivery_data. */
  deliveryMethod?: DeliveryMethod
  deliveryAddress?: string
  deliveryCity?: string
  deliveryPostalCode?: string
}

type CheckoutFormProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  /** Efektyvus PVM tarifas (0 = įmonė ne PVM mokėtoja → PVM nerodom). */
  vatRate: number
  /** Pristatymo kainos/ribos iš shop_settings (žr. /apmokejimas/page.tsx). */
  shipping?: ShippingSettings
  /** Prisijungusio vartotojo profilio duomenys — pre-fill'ina formą,
   *  kad nuolatinis klientas neturėtų kasdien įvesti tų pačių laukų. */
  prefill?: CheckoutFormPrefill
}

export function CheckoutForm({
  lang,
  dict,
  vatRate,
  shipping = DEFAULT_SHIPPING_SETTINGS,
  prefill,
}: CheckoutFormProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  // Atnaujinam kainas iš serverio prieš pirkimą — žr. useRefreshCartPrices.
  useRefreshCartPrices()
  const submittedRef = useRef(false)

  // Forma — pre-fill iš user_profiles, jei prisijungęs (žr. /apmokejimas/page.tsx).
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '')
  const [lastName, setLastName] = useState(prefill?.lastName ?? '')
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [phone, setPhone] = useState(prefill?.phone ?? '')
  const [isCompany, setIsCompany] = useState(prefill?.isCompany ?? false)
  const [companyName, setCompanyName] = useState(prefill?.salonName ?? '')
  const [companyCode, setCompanyCode] = useState(prefill?.companyCode ?? '')
  const [vatCode, setVatCode] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    prefill?.deliveryMethod ?? 'courier'
  )
  // Pre-fill iš last_delivery_data:
  // - courier: address / city / postalCode
  // - parcel_locker: tas pats `deliveryAddress` laukas (order-actions įrašo
  //   paštomato pavadinimą į `address`), tad rodom jį `parcelLocker` lauke
  const [address, setAddress] = useState(
    prefill?.deliveryMethod === 'courier' ? prefill?.deliveryAddress ?? '' : ''
  )
  const [city, setCity] = useState(prefill?.deliveryCity ?? '')
  const [postalCode, setPostalCode] = useState(prefill?.deliveryPostalCode ?? '')
  const [parcelLocker, setParcelLocker] = useState(
    prefill?.deliveryMethod === 'parcel_locker'
      ? prefill?.deliveryAddress ?? ''
      : ''
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [notes, setNotes] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Nuolaidų kodas
  const [discountInput, setDiscountInput] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    cents: number
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Jei krepšelis tuščias po hydration — redirect atgal į krepšelį.
  // Išimtis: ką tik pateiktas užsakymas (submittedRef) — tada jau navigate'inam
  // į confirmation page'ą, ir šis useEffect'as NEturi trukdyti.
  useEffect(() => {
    if (mounted && items.length === 0 && !submittedRef.current) {
      router.replace(`${langPrefix(lang)}/krepselis`)
    }
  }, [mounted, items.length, lang, router])

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )
  // Nuolaidos rodymas UI — server flow vėl perskaičiuos tikrą sumą prieš insert'ą
  const discountCents = appliedDiscount?.cents ?? 0
  const totals = calculateOrderTotals(
    subtotalCents,
    deliveryMethod,
    discountCents,
    vatRate,
    shipping
  )

  // Jei subtotal sumažėjo žemiau kupono vertės po prekių pašalinimo — auto-nuimam kuponą.
  // SVARBU: visi hook'ai turi būti prieš bet kokį early return'ą, kitaip React'as
  // pranešs apie „change in the order of Hooks".
  useEffect(() => {
    if (!appliedDiscount) return
    if (appliedDiscount.cents > subtotalCents) {
      setAppliedDiscount(null)
    }
  }, [subtotalCents, appliedDiscount])

  if (!mounted || items.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-brand-gray-50 rounded-2xl" />
      </div>
    )
  }

  const handleApplyDiscount = async () => {
    setDiscountError(null)
    const code = discountInput.trim().toUpperCase()
    if (!code) {
      setDiscountError(dict.checkout.enterCouponCode)
      return
    }
    setDiscountValidating(true)
    try {
      const result = await validateDiscountCodeAction(
        code,
        items.map((i) => ({
          product_id: i.productId,
          unit_price_cents: i.priceCents,
          quantity: i.quantity,
        })),
        lang
      )
      if (!result.ok) {
        setDiscountError(result.error)
        setAppliedDiscount(null)
        return
      }
      setAppliedDiscount({ code: result.code, cents: result.discountCents })
      setDiscountInput('')
    } catch {
      // Netikėta serverio/tinklo klaida — parodom bendrą žinutę, kad
      // vartotojas neliktų su besisukančiu spineriu be jokio atsako.
      setDiscountError(dict.checkout.errors.couponApplyFailed)
      setAppliedDiscount(null)
    } finally {
      setDiscountValidating(false)
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountError(null)
  }

  const canSubmit =
    meetsMinimumOrder(subtotalCents, shipping.minOrderCents) &&
    agreed &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    (deliveryMethod === 'pickup' ||
      (deliveryMethod === 'courier' && address && city && postalCode) ||
      (deliveryMethod === 'parcel_locker' && parcelLocker))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const deliveryAddress =
      deliveryMethod === 'parcel_locker' ? parcelLocker : address

    startTransition(async () => {
      const result = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          priceCents: i.priceCents,
          quantity: i.quantity,
        })),
        email,
        firstName,
        lastName,
        phone,
        isCompany,
        companyName: isCompany ? companyName : undefined,
        companyCode: isCompany ? companyCode : undefined,
        vatCode: isCompany ? vatCode : undefined,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'pickup' ? undefined : deliveryAddress,
        deliveryCity: deliveryMethod === 'courier' ? city : undefined,
        deliveryPostalCode: deliveryMethod === 'courier' ? postalCode : undefined,
        paymentMethod,
        notes: notes || undefined,
        locale: lang,
        discountCode: appliedDiscount?.code,
      })

      if (result.ok) {
        submittedRef.current = true
        clear()
        window.location.assign(result.redirectTo)
      } else {
        setErrorMsg(result.error)
      }
    })
  }

  const deliveryOptions: {
    value: DeliveryMethod
    icon: typeof Truck
    title: string
    desc: string
    priceCents: number
  }[] = [
    {
      value: 'courier',
      icon: Truck,
      title: dict.checkout.courier,
      desc: dict.checkout.courierDesc,
      priceCents: shipping.courierCents,
    },
    {
      value: 'parcel_locker',
      icon: Package,
      title: dict.checkout.parcelLocker,
      desc: dict.checkout.parcelLockerDesc,
      priceCents: shipping.parcelLockerCents,
    },
    {
      value: 'pickup',
      icon: Building2,
      title: dict.checkout.pickup,
      desc: dict.checkout.pickupDesc,
      priceCents: shipping.pickupCents,
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-10">
      {/* Kairė — formos laukai */}
      <div className="space-y-8">
        <Link
          href={`${langPrefix(lang)}/krepselis`}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {dict.checkout.backToCart}
        </Link>

        {/* Kontaktai */}
        <Fieldset title={dict.checkout.contactInfo}>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label={dict.checkout.firstName}
              value={firstName}
              onChange={setFirstName}
              autoComplete="given-name"
              required
            />
            <TextField
              label={dict.checkout.lastName}
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
              required
            />
            <TextField
              label={dict.checkout.email}
              value={email}
              onChange={setEmail}
              type="email"
              required
            />
            <TextField
              label={dict.checkout.phone}
              value={phone}
              onChange={setPhone}
              type="tel"
              required
              placeholder="+370 ..."
              pattern="^[+0-9 ()\-]{6,}$"
              title={dict.checkout.phoneInvalid}
            />
          </div>
          <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCompany}
              onChange={(e) => setIsCompany(e.target.checked)}
              className="w-4 h-4 accent-brand-magenta"
            />
            <span className="text-sm text-brand-gray-900">
              {dict.checkout.isCompany}
            </span>
          </label>
          {isCompany && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <TextField
                label={dict.checkout.companyName}
                value={companyName}
                onChange={setCompanyName}
                autoComplete="organization"
                required
              />
              <TextField
                label={dict.checkout.companyCode}
                value={companyCode}
                onChange={setCompanyCode}
                inputMode="numeric"
                required
              />
              <TextField
                label={dict.checkout.vatCode}
                value={vatCode}
                onChange={setVatCode}
                className="sm:col-span-2"
              />
            </div>
          )}
        </Fieldset>

        {/* Pristatymas */}
        <Fieldset title={dict.checkout.deliveryMethod}>
          <div className="space-y-3">
            {deliveryOptions.map(({ value, icon: Icon, title, desc, priceCents }) => {
              const selected = deliveryMethod === value
              const free =
                subtotalCents >= shipping.freeShippingThresholdCents &&
                priceCents > 0
              return (
                <label
                  key={value}
                  className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    selected
                      ? 'border-brand-magenta bg-brand-magenta/5'
                      : 'border-brand-gray-50 hover:border-brand-gray-500/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={value}
                    checked={selected}
                    onChange={() => setDeliveryMethod(value)}
                    className="mt-1 accent-brand-magenta shrink-0"
                  />
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gray-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brand-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title + price: stack on mobile, side-by-side >=sm.
                        Anksčiau `whitespace-nowrap` ant "Nemokamas" kartu su
                        ilga antrašte (pvz. "Atsiėmimas Kaune") siaurame
                        viewport'e pjaudavo dešinįjį tekstą. */}
                    <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="font-semibold text-brand-gray-900 text-sm sm:text-base">
                        {title}
                      </div>
                      <div className="text-sm font-bold text-brand-magenta">
                        {priceCents === 0 || free
                          ? dict.cart.freeShipping
                          : formatPrice(priceCents / 100, lang)}
                      </div>
                    </div>
                    <div className="text-xs text-brand-gray-500 mt-1">{desc}</div>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Adreso laukai priklauso nuo pristatymo būdo */}
          {deliveryMethod === 'courier' && (
            <div className="space-y-4 mt-6">
              <TextField
                label={dict.checkout.address}
                value={address}
                onChange={setAddress}
                autoComplete="street-address"
                required
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField
                  label={dict.checkout.city}
                  value={city}
                  onChange={setCity}
                  autoComplete="address-level2"
                  required
                />
                <TextField
                  label={dict.checkout.postalCode}
                  value={postalCode}
                  onChange={setPostalCode}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          )}
          {deliveryMethod === 'parcel_locker' && (
            <div className="mt-6">
              <OmnivaLockerPicker
                value={parcelLocker}
                onChange={setParcelLocker}
                dict={dict.checkout}
              />
            </div>
          )}
        </Fieldset>

        {/* Mokėjimas */}
        <Fieldset title={dict.checkout.paymentMethod}>
          <div className="space-y-3">
            <PaymentOption
              value="bank_transfer"
              selected={paymentMethod === 'bank_transfer'}
              onSelect={() => setPaymentMethod('bank_transfer')}
              icon={Banknote}
              title={dict.checkout.bankTransfer}
              desc={dict.checkout.bankTransferDesc}
            />
          </div>
        </Fieldset>

        {/* Pastabos */}
        <Fieldset title={dict.checkout.notes}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl focus:outline-none focus:border-brand-magenta transition-colors resize-none text-sm"
          />
        </Fieldset>
      </div>

      {/* Dešinė — užsakymo suvestinė */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="bg-brand-gray-50 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-brand-gray-900">
            {dict.checkout.orderSummary}
          </h2>

          {/* Prekių sąrašas */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-brand-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-brand-gray-500">
                    × {item.quantity}
                  </div>
                </div>
                <div className="font-semibold text-brand-gray-900 tabular-nums whitespace-nowrap">
                  {formatPrice((item.priceCents * item.quantity) / 100, lang)}
                </div>
              </div>
            ))}
          </div>

          {/* Nuolaidos kupono laukas */}
          <div className="pt-4 border-t border-brand-gray-50/60">
            {appliedDiscount ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-brand-magenta/5 border border-brand-magenta/20 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-brand-magenta flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold font-mono text-brand-magenta truncate">
                      {appliedDiscount.code}
                    </div>
                    <div className="text-[11px] text-brand-gray-500">
                      {dict.checkout.discountApplied}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="p-1.5 text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
                  aria-label={dict.checkout.removeDiscount}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value)
                      setDiscountError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleApplyDiscount()
                      }
                    }}
                    placeholder={dict.checkout.discountCode}
                    className="flex-1 px-3 py-2 bg-white border border-brand-gray-50 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-brand-magenta transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={discountValidating || !discountInput.trim()}
                    className="px-4 py-2 bg-brand-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-brand-gray-900/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {discountValidating ? '…' : dict.checkout.applyDiscount}
                  </button>
                </div>
                {discountError && (
                  <div className="mt-2 text-[11px] text-brand-magenta">
                    {discountError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm pt-4 border-t border-brand-gray-50/60">
            <Row
              label={dict.cart.subtotal}
              value={formatPrice(totals.subtotalCents / 100, lang)}
            />
            {totals.discountCents > 0 && (
              <Row
                label={`${dict.checkout.discountLabel}${appliedDiscount ? ` (${appliedDiscount.code})` : ''}`}
                value={`−${formatPrice(totals.discountCents / 100, lang)}`}
                accent
              />
            )}
            <Row
              label={dict.cart.shipping}
              value={
                totals.shippingCents === 0
                  ? dict.cart.freeShipping
                  : formatPrice(totals.shippingCents / 100, lang)
              }
            />
            {totals.vatCents > 0 && (
              <Row
                label={dict.checkout.vat}
                value={formatPrice(totals.vatCents / 100, lang)}
                muted
              />
            )}
          </div>

          <div className="flex justify-between items-baseline pt-4 border-t border-brand-gray-50/60">
            <span className="text-base font-bold text-brand-gray-900">
              {dict.cart.total}
            </span>
            <span className="text-2xl font-bold text-brand-gray-900 tabular-nums">
              {formatPrice(totals.totalCents / 100, lang)}
            </span>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-magenta"
            />
            <span className="text-xs text-brand-gray-500 leading-relaxed">
              {dict.checkout.agreeTerms}
            </span>
          </label>

          {errorMsg && (
            <div className="bg-white border border-brand-magenta/30 text-brand-magenta text-xs rounded-xl p-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? dict.checkout.processing : dict.checkout.placeOrder}
          </button>

          {/* Trust signal'ai — paskutinis pasitikėjimo stiprintojas prieš
              pirkimą. Aiškiai matomi po Pirkti mygtuku. */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-brand-gray-50/60">
            <TrustBadge icon={Lock} label={dict.checkout.trustPayment} />
            <TrustBadge icon={RotateCcw} label={dict.checkout.trustReturn} />
            <TrustBadge icon={HeadphonesIcon} label={dict.checkout.trustSupport} />
          </div>
        </div>
      </aside>

      {/* Mobile sticky bottom bar — Total + Pirkti visada matomas, nesvarbu
          kur klientas yra formoje. Slepiama nuo md+ (ten šoninis aside'as
          su sticky efektu jau veikia desktop'e). Submit type'as veikia,
          nes mygtukas yra <form> viduje. */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-gray-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
              {dict.cart.total}
            </div>
            <div className="text-xl font-bold text-brand-gray-900 tabular-nums leading-tight">
              {formatPrice(totals.totalCents / 100, lang)}
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? dict.checkout.processing : dict.checkout.placeOrder}
          </button>
        </div>
      </div>

      {/* Mobile tarpas, kad sticky bar'as nedengtu paskutinio formos
          turinio (krepšelio sumavimo aside'o). md+ — nereikia. */}
      <div className="md:hidden h-24" aria-hidden="true" />
    </form>
  )
}

function Fieldset({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-brand-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

/** Mažytis trust signal'as — ikona viršuje, etiketė apačioje. Tikslas —
 *  pasitikėjimo žinutė prieš pat „Pirkti" mygtuko paspaudimą. */
function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Lock
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="w-7 h-7 rounded-full bg-brand-gray-50 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-brand-gray-900" />
      </div>
      <span className="text-[10px] leading-tight text-brand-gray-500">
        {label}
      </span>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  className = '',
  autoComplete,
  inputMode,
  pattern,
  title,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  className?: string
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url'
  /** HTML5 pattern (regex) — naudojama formų validacijai. */
  pattern?: string
  /** Pranešimas, kuris parodomas, jei pattern nesutampa. */
  title?: string
}) {
  const resolvedAutoComplete =
    autoComplete ??
    (type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined)
  const resolvedInputMode =
    inputMode ??
    (type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined)

  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
        {label} {required && <span className="text-brand-magenta">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={resolvedAutoComplete}
        inputMode={resolvedInputMode}
        pattern={pattern}
        title={title}
        className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl focus:outline-none focus:border-brand-magenta transition-colors text-sm bg-white"
      />
    </label>
  )
}

function PaymentOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  desc,
  disabled,
}: {
  value: PaymentMethod
  selected: boolean
  onSelect: () => void
  icon: typeof Banknote
  title: string
  desc: string
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-colors ${
        disabled
          ? 'border-brand-gray-50 opacity-50 cursor-not-allowed'
          : selected
            ? 'border-brand-magenta bg-brand-magenta/5 cursor-pointer'
            : 'border-brand-gray-50 hover:border-brand-gray-500/30 cursor-pointer'
      }`}
    >
      <input
        type="radio"
        name="payment"
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        className="mt-1 accent-brand-magenta shrink-0"
      />
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gray-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-gray-900" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-brand-gray-900 text-sm sm:text-base">
          {title}
        </div>
        <div className="text-xs text-brand-gray-500 mt-1">{desc}</div>
      </div>
    </label>
  )
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
}) {
  const colorClass = accent
    ? 'text-brand-magenta'
    : muted
      ? 'text-brand-gray-500'
      : 'text-brand-gray-900'
  return (
    <div className={`flex justify-between ${colorClass}`}>
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
