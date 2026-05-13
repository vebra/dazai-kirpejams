import { unstable_cache } from 'next/cache'

/**
 * Renginio matomumo (viešas „on/off") helper'is. Reikšmė saugoma
 * `shop_settings.event_visible` JSONB stulpelyje. Default `true` —
 * jei migracija dar nepritaikyta arba DB nepasiekiamas, esama elgsena
 * (renginio info matoma) išlaikoma.
 *
 * Cache'as: tagas `event-visibility`, revalidate 60s. Admin toggle
 * action'as iškviečia `revalidateTag('event-visibility')`.
 */

export const EVENT_VISIBILITY_TAG = 'event-visibility'

async function _getEventVisibility(): Promise<boolean> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('shop_settings')
      .select('value')
      .eq('key', 'event_visible')
      .maybeSingle()

    if (error) {
      console.error('[events/visibility] getEventVisibility:', error.message)
      return true
    }

    if (data === null) return true
    const v = data.value
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return v !== 'false'
    return true
  } catch (e) {
    console.error('[events/visibility] getEventVisibility exception:', e)
    return true
  }
}

export const getEventVisibility = unstable_cache(
  _getEventVisibility,
  ['event-visibility'],
  { revalidate: 60, tags: [EVENT_VISIBILITY_TAG] }
)
