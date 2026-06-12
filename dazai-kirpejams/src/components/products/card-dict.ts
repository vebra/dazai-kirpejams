/**
 * Žodyno dalys, kurių reikia produktų listingo UI (ProductCard,
 * CategoryProductsView, ShowMoreGrid). Pilnas žodynas — ~90–140 KB
 * kiekvienai kalbai; perduotas client komponentui jis visas patenka į
 * puslapio payload'ą. Listingams pakanka šių trijų sekcijų.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pickCardDict(dict: Record<string, any>) {
  return {
    categoryPage: dict.categoryPage,
    popular: dict.popular,
    productPage: { chooseSize: dict.productPage?.chooseSize },
  }
}
