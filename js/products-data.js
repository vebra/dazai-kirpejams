/* ============================================
   PRODUKTŲ DUOMENŲ BAZĖ — 50 spalvų
   ============================================ */

const PRODUCTS = {
  // NATURAL
  "1.00":   { name: "Color SHOCK 1.00",   shade: "Juoda",                        category: "Natural",           color: "#1A1A1A", price: 7.99, oldPrice: 10.00 },
  "3.00":   { name: "Color SHOCK 3.00",   shade: "Tamsiai kaštoninė",            category: "Natural",           color: "#3B2314", price: 7.99, oldPrice: 10.00 },
  "4.00":   { name: "Color SHOCK 4.00",   shade: "Kaštoninė",                    category: "Natural",           color: "#4A3021", price: 7.99, oldPrice: 10.00 },
  "5.00":   { name: "Color SHOCK 5.00",   shade: "Šviesi kaštoninė",             category: "Natural",           color: "#5C3D2E", price: 7.99, oldPrice: 10.00 },
  "6.00":   { name: "Color SHOCK 6.00",   shade: "Tamsiai blondinė",             category: "Natural",           color: "#7A5A3E", price: 7.99, oldPrice: 10.00 },
  "7.00":   { name: "Color SHOCK 7.00",   shade: "Vidutinė blondinė",            category: "Natural",           color: "#8B7355", price: 7.99, oldPrice: 10.00 },
  "8.00":   { name: "Color SHOCK 8.00",   shade: "Šviesi blondinė",              category: "Natural",           color: "#B8956A", price: 7.99, oldPrice: 10.00 },
  "9.00":   { name: "Color SHOCK 9.00",   shade: "Labai šviesi blondinė",        category: "Natural",           color: "#D4B896", price: 7.99, oldPrice: 10.00 },
  "10.00":  { name: "Color SHOCK 10.00",  shade: "Ekstra šviesi blondinė",       category: "Natural",           color: "#E8D5B8", price: 7.99, oldPrice: 10.00 },

  // ASH
  "5.1":    { name: "Color SHOCK 5.1",    shade: "Šviesi pelenų kaštoninė",      category: "Ash",              color: "#6B5D52", price: 7.99, oldPrice: 10.00 },
  "6.1":    { name: "Color SHOCK 6.1",    shade: "Tamsiai pelenų blondinė",      category: "Ash",              color: "#8A7D6E", price: 7.99, oldPrice: 10.00 },
  "7.1":    { name: "Color SHOCK 7.1",    shade: "Pelenų blondinė",              category: "Ash",              color: "#A09585", price: 7.99, oldPrice: 10.00 },
  "8.1":    { name: "Color SHOCK 8.1",    shade: "Šviesi pelenų blondinė",       category: "Ash",              color: "#B8AE9E", price: 7.99, oldPrice: 10.00 },
  "9.1":    { name: "Color SHOCK 9.1",    shade: "Labai šviesi pelenų blondinė", category: "Ash",              color: "#D0C8B8", price: 7.99, oldPrice: 10.00 },
  "10.1":   { name: "Color SHOCK 10.1",   shade: "Ekstra šviesi pelenų blondinė",category: "Ash",              color: "#E2DDD0", price: 7.99, oldPrice: 10.00 },

  // ICY CHOCOLATE
  "7.18":   { name: "Color SHOCK 7.18",   shade: "Ledinis šokoladas",            category: "Icy Chocolate",     color: "#7A6550", price: 7.99, oldPrice: 10.00 },

  // GOLDEN
  "9.3":    { name: "Color SHOCK 9.3",    shade: "Auksinė blondinė",             category: "Golden",            color: "#C4A24E", price: 7.99, oldPrice: 10.00 },

  // ASH PEARL
  "7.12":   { name: "Color SHOCK 7.12",   shade: "Pelenų perlinė blondinė",     category: "Ash Pearl",         color: "#8A7872", price: 7.99, oldPrice: 10.00 },
  "8.12":   { name: "Color SHOCK 8.12",   shade: "Šviesi pelenų perlinė",        category: "Ash Pearl",         color: "#A8968F", price: 7.99, oldPrice: 10.00 },
  "9.12":   { name: "Color SHOCK 9.12",   shade: "Labai šviesi pelenų perlinė",  category: "Ash Pearl",         color: "#C4B5AE", price: 7.99, oldPrice: 10.00 },

  // VIOLET
  "5.22":   { name: "Color SHOCK 5.22",   shade: "Intensyvi violetinė",          category: "Violet",            color: "#5C1A6E", price: 7.99, oldPrice: 10.00 },

  // VIOLET GOLD
  "4.23":   { name: "Color SHOCK 4.23",   shade: "Violetinė auksinė kaštoninė",  category: "Violet Gold",       color: "#5A3828", price: 7.99, oldPrice: 10.00 },

  // WARM BEIGE
  "6.32":   { name: "Color SHOCK 6.32",   shade: "Tamsiai bežinė",               category: "Warm Beige",        color: "#8A6E4E", price: 7.99, oldPrice: 10.00 },
  "7.32":   { name: "Color SHOCK 7.32",   shade: "Šiltai bežinė blondinė",       category: "Warm Beige",        color: "#A08462", price: 7.99, oldPrice: 10.00 },
  "8.32":   { name: "Color SHOCK 8.32",   shade: "Šviesi bežinė blondinė",       category: "Warm Beige",        color: "#C4A07A", price: 7.99, oldPrice: 10.00 },
  "9.32":   { name: "Color SHOCK 9.32",   shade: "Labai šviesi bežinė",          category: "Warm Beige",        color: "#D8BFA0", price: 7.99, oldPrice: 10.00 },
  "10.32":  { name: "Color SHOCK 10.32",  shade: "Ekstra šviesi bežinė",         category: "Warm Beige",        color: "#E8D5B8", price: 7.99, oldPrice: 10.00 },

  // COPPER
  "7.444":  { name: "Color SHOCK 7.444",  shade: "Intensyvi varinė",             category: "Copper",            color: "#C4622A", price: 7.99, oldPrice: 10.00 },
  "8.444":  { name: "Color SHOCK 8.444",  shade: "Šviesi intensyvi varinė",      category: "Copper",            color: "#D4884A", price: 7.99, oldPrice: 10.00 },

  // MAHOGANY
  "6.5":    { name: "Color SHOCK 6.5",    shade: "Raudonmedžio",                 category: "Mahogany",          color: "#6E2244", price: 7.99, oldPrice: 10.00 },

  // RED
  "6.66":   { name: "Color SHOCK 6.66",   shade: "Intensyvi raudona",            category: "Red",               color: "#A52A2A", price: 7.99, oldPrice: 10.00 },
  "7.66":   { name: "Color SHOCK 7.66",   shade: "Šviesi intensyvi raudona",     category: "Red",               color: "#C44040", price: 7.99, oldPrice: 10.00 },

  // CHOCOLATE
  "5.8":    { name: "Color SHOCK 5.8",    shade: "Šokoladinė",                   category: "Chocolate",         color: "#5C3420", price: 7.99, oldPrice: 10.00 },
  "6.8":    { name: "Color SHOCK 6.8",    shade: "Šviesi šokoladinė",            category: "Chocolate",         color: "#7A4A2E", price: 7.99, oldPrice: 10.00 },

  // SUPERLIFT
  "11.11":  { name: "Color SHOCK 11.11",  shade: "Super šviesi pelenų",          category: "Superlift",         color: "#C8B8A8", price: 7.99, oldPrice: 10.00 },
  "12.0":   { name: "Color SHOCK 12.0",   shade: "Ultra šviesi natūrali",        category: "Superlift",         color: "#D8CFC5", price: 7.99, oldPrice: 10.00 },
  "12.2":   { name: "Color SHOCK 12.2",   shade: "Ultra šviesi perlinė",         category: "Superlift",         color: "#E0D2C8", price: 7.99, oldPrice: 10.00 },
  "12.12":  { name: "Color SHOCK 12.12",  shade: "Ultra pelenų perlinė",         category: "Superlift",         color: "#D8C8C0", price: 7.99, oldPrice: 10.00 },
  "12.21":  { name: "Color SHOCK 12.21",  shade: "Ultra perlinė pelenų",         category: "Superlift",         color: "#DFD0C8", price: 7.99, oldPrice: 10.00 },
  "12.62":  { name: "Color SHOCK 12.62",  shade: "Ultra rožinė perlinė",         category: "Superlift",         color: "#D8C4C0", price: 7.99, oldPrice: 10.00 },

  // TONER & CORRECTORS
  "silver-grey":  { name: "Color SHOCK Silver Grey",  shade: "Sidabrinė pilka",   category: "Toner & Correctors", color: "#8A8A8A", price: 7.99, oldPrice: 10.00 },
  "light-grey":   { name: "Color SHOCK Light Grey",   shade: "Šviesi pilka",      category: "Toner & Correctors", color: "#B0B0B0", price: 7.99, oldPrice: 10.00 },
  "dark-grey":    { name: "Color SHOCK Dark Grey",    shade: "Tamsiai pilka",     category: "Toner & Correctors", color: "#6A6A6A", price: 7.99, oldPrice: 10.00 },
  "silver-pearl": { name: "Color SHOCK Silver Pearl", shade: "Sidabrinė perlinė", category: "Toner & Correctors", color: "#C0B8B0", price: 7.99, oldPrice: 10.00 },
  "silver-beige": { name: "Color SHOCK Silver Beige", shade: "Sidabrinė bežinė",  category: "Toner & Correctors", color: "#C8B8A0", price: 7.99, oldPrice: 10.00 },
  "lilac":        { name: "Color SHOCK Lilac",        shade: "Alyvinė",           category: "Toner & Correctors", color: "#C8A0B0", price: 7.99, oldPrice: 10.00 }
};

// Get product by shade ID
function getProduct(shadeId) {
  return PRODUCTS[shadeId] || null;
}

// Get all shade IDs
function getAllShadeIds() {
  return Object.keys(PRODUCTS);
}

// Get related products (same category, excluding current)
function getRelatedProducts(shadeId, limit = 4) {
  const current = PRODUCTS[shadeId];
  if (!current) return [];

  const related = [];
  for (const [id, product] of Object.entries(PRODUCTS)) {
    if (id !== shadeId && product.category === current.category) {
      related.push({ id, ...product });
    }
  }

  // If not enough from same category, add from others
  if (related.length < limit) {
    for (const [id, product] of Object.entries(PRODUCTS)) {
      if (id !== shadeId && product.category !== current.category && related.length < limit) {
        related.push({ id, ...product });
      }
    }
  }

  return related.slice(0, limit);
}
