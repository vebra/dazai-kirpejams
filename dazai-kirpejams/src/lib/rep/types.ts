/**
 * Client-safe rep tipai + etiketės (jokio server-only importo — naudoja ir
 * serverio užklausos, ir client komponentai).
 */
export { TIER_LABELS } from '@/lib/admin/rep-orders-shared'

export type RepClient = {
  id: string
  name: string
  phone: string | null
  email: string | null
  pricingTier: string
}

export type RepProduct = {
  id: string
  nameLt: string
  sku: string | null
  colorNumber: string | null
  stockQuantity: number
  /** tier ('wholesale_1'|...) → kaina centais. Jei tier nėra — produkto pridėti negalima. */
  prices: Record<string, number>
}

export type RepApprovalStatus = 'pending' | 'approved' | 'rejected'

export type RepOrderListItem = {
  id: string
  orderNumber: string
  createdAt: string
  clientName: string | null
  approvalStatus: RepApprovalStatus | null
  totalCents: number
  itemCount: number
  rejectionReason: string | null
}

export const APPROVAL_LABELS: Record<RepApprovalStatus, string> = {
  pending: 'Laukia patvirtinimo',
  approved: 'Patvirtinta',
  rejected: 'Atmesta',
}

export const APPROVAL_BADGE: Record<RepApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}
