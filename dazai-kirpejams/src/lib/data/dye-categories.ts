/**
 * Color SHOCK HTML kategorijų metaduomenys — atitinka originalų
 * `category.html` išdėstymą (14 grupių, su bullet spalvomis ir slug sąrašais).
 *
 * Naudojama:
 *  - kategorijos puslapio grupavimui (h2 antraštės su bullet'ais)
 *  - filtro dropdown'o opcijoms su skaičiais
 *  - URL parametro `?group=natural` validacijai
 *
 * Slug'ai turi atitikti `hairDyeColors` sąrašą `mock-products.ts` ir DB.
 */

export type DyeCategoryKey =
  | 'natural'
  | 'ash'
  | 'icy-chocolate'
  | 'golden'
  | 'ash-pearl'
  | 'violet'
  | 'violet-gold'
  | 'warm-beige'
  | 'copper'
  | 'mahogany'
  | 'red'
  | 'chocolate'
  | 'superlift'
  | 'toner'
  | 'men'

export type DyeCategory = {
  key: DyeCategoryKey
  label: string
  /** Bullet spalva h2 antraštėje (iš HTML `group-badge` inline style) */
  bullet: string
  /** Gradient bullet'ui (Toner & Correctors atvejis) */
  bulletGradient?: string
  /** Produktų slug'ai šioje kategorijoje — HTML eilės tvarka */
  slugs: string[]
}

/** HTML dizaino eilės tvarka (žr. `category.html` color-group blokus) */
export const DYE_CATEGORIES: DyeCategory[] = [
  {
    key: 'natural',
    label: 'Natural',
    bullet: '#1A1A1A',
    slugs: [
      'color-shock-1-00',
      'color-shock-3-00',
      'color-shock-4-00',
      'color-shock-5-00',
      'color-shock-6-00',
      'color-shock-7-00',
      'color-shock-8-00',
      'color-shock-9-00',
      'color-shock-10-00',
    ],
  },
  {
    key: 'ash',
    label: 'Ash',
    bullet: '#8A8478',
    slugs: [
      'color-shock-5-1',
      'color-shock-6-1',
      'color-shock-7-1',
      'color-shock-8-1',
      'color-shock-9-1',
      'color-shock-10-1',
    ],
  },
  {
    key: 'icy-chocolate',
    label: 'Icy Chocolate',
    bullet: '#7A6550',
    slugs: ['color-shock-7-18'],
  },
  {
    key: 'golden',
    label: 'Golden',
    bullet: '#C4A24E',
    slugs: ['color-shock-9-3'],
  },
  {
    key: 'ash-pearl',
    label: 'Ash Pearl',
    bullet: '#9E8E8A',
    slugs: [
      'color-shock-7-12',
      'color-shock-8-12',
      'color-shock-9-12',
    ],
  },
  {
    key: 'violet',
    label: 'Violet',
    bullet: '#5C1A6E',
    slugs: ['color-shock-5-22'],
  },
  {
    key: 'violet-gold',
    label: 'Violet Gold',
    bullet: '#5A3828',
    slugs: ['color-shock-4-23'],
  },
  {
    key: 'warm-beige',
    label: 'Warm Beige',
    bullet: '#C4A07A',
    slugs: [
      'color-shock-6-32',
      'color-shock-7-32',
      'color-shock-8-32',
      'color-shock-9-32',
      'color-shock-10-32',
    ],
  },
  {
    key: 'copper',
    label: 'Copper',
    bullet: '#C4622A',
    slugs: ['color-shock-7-444', 'color-shock-8-444'],
  },
  {
    key: 'mahogany',
    label: 'Mahogany',
    bullet: '#6E2244',
    slugs: ['color-shock-6-5'],
  },
  {
    key: 'red',
    label: 'Red',
    bullet: '#A52A2A',
    slugs: ['color-shock-6-66', 'color-shock-7-66'],
  },
  {
    key: 'chocolate',
    label: 'Chocolate',
    bullet: '#5C3420',
    slugs: ['color-shock-5-8', 'color-shock-6-8'],
  },
  {
    key: 'superlift',
    label: 'Superlift',
    bullet: '#E0D0C0',
    slugs: [
      'color-shock-11-11',
      'color-shock-12-0',
      'color-shock-12-2',
      'color-shock-12-12',
      'color-shock-12-21',
      'color-shock-12-62',
    ],
  },
  {
    key: 'toner',
    label: 'Toner & Correctors',
    bullet: '#A0A0A0',
    bulletGradient: 'linear-gradient(135deg, #A0A0A0, #C0B8C8)',
    slugs: [
      'color-shock-silver-grey',
      'color-shock-light-grey',
      'color-shock-dark-grey',
      'color-shock-silver-pearl',
      'color-shock-silver-beige',
      'color-shock-lilac',
    ],
  },
  {
    key: 'men',
    label: 'MEN',
    bullet: '#1A1A1A',
    slugs: [
      'color-shock-4-men',
      'color-shock-5-men',
      'color-shock-6-men',
      'color-shock-7-men',
    ],
  },
]

/** slug → DyeCategoryKey lookup (prekompiliuotas O(1) prieigai) */
const SLUG_TO_CATEGORY = new Map<string, DyeCategoryKey>()
for (const cat of DYE_CATEGORIES) {
  for (const slug of cat.slugs) {
    SLUG_TO_CATEGORY.set(slug, cat.key)
  }
}

export function getDyeCategoryKeyBySlug(
  slug: string
): DyeCategoryKey | undefined {
  return SLUG_TO_CATEGORY.get(slug)
}

/**
 * Bendras dažų atspalvių kiekis — 50 spalvų (46 iš originalaus HTML katalogo
 * + 4 MEN linijos atspalviai). Atitinka top badge „50 spalvų" ir dropdown
 * „Visos spalvos (50)".
 */
export const DYE_PALETTE_TARGET_COUNT = 50
