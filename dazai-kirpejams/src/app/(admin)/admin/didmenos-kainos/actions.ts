'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'

/**
 * Didmeninių kainų (product_prices) nustatymas. RLS: rašyti gali TIK admin.
 * Kiekvienam tier: teigiamas sveikas centų skaičius → upsert; null → ištrina
 * tos grupės kainą (produktas tampa „nenustatytas" tam tier).
 */
export type SaveWholesaleResult = { ok: boolean; error?: string }

const TIERS = ['wholesale_1', 'wholesale_2', 'wholesale_3'] as const
type Tier = (typeof TIERS)[number]

export async function setWholesalePrices(
  productId: string,
  prices: Record<Tier, number | null>
): Promise<SaveWholesaleResult> {
  await requireAdmin()
  if (!productId) return { ok: false, error: 'Trūksta produkto.' }

  const supabase = await createServerSupabase()

  for (const tier of TIERS) {
    const v = prices[tier]
    if (v === null || v === undefined) {
      const { error } = await supabase
        .from('product_prices')
        .delete()
        .eq('product_id', productId)
        .eq('tier', tier)
      if (error) {
        console.error('[admin/didmenos-kainos] delete:', error.message)
        return { ok: false, error: 'Nepavyko išsaugoti.' }
      }
    } else {
      if (!Number.isInteger(v) || v <= 0) {
        return { ok: false, error: 'Kaina turi būti teigiama.' }
      }
      const { error } = await supabase
        .from('product_prices')
        .upsert(
          { product_id: productId, tier, price_cents: v },
          { onConflict: 'product_id,tier' }
        )
      if (error) {
        console.error('[admin/didmenos-kainos] upsert:', error.message)
        return { ok: false, error: 'Nepavyko išsaugoti.' }
      }
    }
  }

  revalidatePath('/admin/didmenos-kainos')
  return { ok: true }
}
