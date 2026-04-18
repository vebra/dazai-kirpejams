'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Truck,
  Package,
  Building2,
  CreditCard,
  Banknote,
  Tag,
  X,
} from 'lucide-react'
import { useCartStore } from '@/lib/commerce/cart-store'
import {
  calculateOrderTotals,
  meetsMinimumOrder,
  SHIPPING_COURIER_CENTS,
  SHIPPING_PARCEL_LOCKER_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/lib/commerce/constants'
import { formatPrice, langPrefix } from '@/lib/utils'
import { createOrder } from '@/lib/commerce/order-actions'
import { validateDiscountCodeAction } from '@/lib/commerce/discount-actions'
import type { Locale } from '@/i18n/config'

type CheckoutFormProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

export function CheckoutForm({ lang, dict }: CheckoutFormProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)

  // Forma
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [vatCode, setVatCode] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [parcelLocker, setParcelLocker] = useState('')
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

  // Jei krepšelis tuščias po hydration — redirect atgal į krepšelį
  useEffect(() => {
    if (mounted && items.length === 0) {
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
    discountCents
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
      setDiscountError('Įveskite kupono kodą.')
      return
    }
    setDiscountValidating(true)
    try {
      const result = await validateDiscountCodeAction(code, subtotalCents)
      if (!result.ok) {
        setDiscountError(result.error)
        setAppliedDiscount(null)
        return
      }
      setAppliedDiscount({ code: result.code, cents: result.discountCents })
      setDiscountInput('')
    } finally {
      setDiscountValidating(false)
    }
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountError(null)
  }

  const canSubmit =
    meetsMinimumOrder(subtotalCents) &&
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
        clear()
        router.push(result.redirectTo)
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
      priceCents: SHIPPING_COURIER_CENTS,
    },
    {
      value: 'parcel_locker',
      icon: Package,
      title: dict.checkout.parcelLocker,
      desc: dict.checkout.parcelLockerDesc,
      priceCents: SHIPPING_PARCEL_LOCKER_CENTS,
    },
    {
      value: 'pickup',
      icon: Building2,
      title: dict.checkout.pickup,
      desc: dict.checkout.pickupDesc,
      priceCents: 0,
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
                subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS && priceCents > 0
              return (
                <label
                  key={value}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
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
                    className="mt-1 accent-brand-magenta"
                  />
                  <div className="w-10 h-10 rounded-xl bg-brand-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-brand-gray-900">
                        {title}
                      </div>
                      <div className="text-sm font-bold text-brand-magenta whitespace-nowrap">
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
              <TextField
                label={dict.checkout.parcelLockerSelect}
                value={parcelLocker}
                onChange={setParcelLocker}
                placeholder={dict.checkout.parcelLockerPlaceholder}
                required
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
            <PaymentOption
              value="paysera"
              selected={paymentMethod === 'paysera'}
              onSelect={() => setPaymentMethod('paysera')}
              icon={CreditCard}
              title={dict.checkout.paysera}
              desc={dict.checkout.payseraDesc}
              disabled
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
            <Row
              label={dict.checkout.vat}
              value={formatPrice(totals.vatCents / 100, lang)}
              muted
            />
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
        </div>
      </aside>
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
  icon: typeof CreditCard
  title: string
  desc: string
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-colors ${
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
        className="mt-1 accent-brand-magenta"
      />
      <div className="w-10 h-10 rounded-xl bg-brand-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-brand-gray-900" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-brand-gray-900">{title}</div>
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
