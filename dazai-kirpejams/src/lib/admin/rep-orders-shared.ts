/**
 * Client-safe tipai + konstantos rep užsakymų patvirtinimams.
 *
 * SVARBU: jokio `server-only` importo — šį modulį naudoja ir serverio
 * užklausos (queries.ts), ir client komponentas (PendingApprovals.tsx).
 * Runtime reikšmės (pvz. TIER_LABELS) negali gyventi queries.ts, nes tai
 * įtrauktų visą server-only modulį į client bundle.
 */

export const TIER_LABELS: Record<string, string> = {
  wholesale_1: 'Didmena I',
  wholesale_2: 'Didmena II',
  wholesale_3: 'Didmena III',
}

export type PendingRepOrderItem = {
  productName: string
  productSku: string | null
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export type PendingRepOrder = {
  id: string
  orderNumber: string
  createdAt: string
  notes: string | null
  subtotalCents: number
  vatCents: number
  deliveryCents: number
  totalCents: number
  deliveryMethod: string
  paymentMethod: string
  deliveryCity: string | null
  deliveryAddress: string | null
  deliveryPostalCode: string | null
  clientName: string | null
  clientTier: string | null
  repName: string | null
  items: PendingRepOrderItem[]
}
