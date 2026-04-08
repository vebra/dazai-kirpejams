import type { Category } from '@/lib/types'

/**
 * Helper'is iš kategorijų sąrašo sukuria greitą ID → slug lookup žemėlapį.
 * Reikia perduoti kategorijas iš `getCategories()` — ne iš mock duomenų,
 * kad ir Supabase UUIDs atveju veiktų teisingai.
 */
export function buildCategorySlugMap(
  categories: Category[]
): Map<string, string> {
  return new Map(categories.map((c) => [c.id, c.slug]))
}

export function getCategorySlugFromMap(
  map: Map<string, string>,
  categoryId: string
): string {
  return map.get(categoryId) || 'visi'
}
