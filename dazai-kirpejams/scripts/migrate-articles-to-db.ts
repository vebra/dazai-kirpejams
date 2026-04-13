/**
 * Konvertuoja statinius straipsnius iš articles.ts į SQL INSERT
 * ir rašo į supabase/migrations/011_seed_blog_posts.sql
 *
 * Paleisti: npx tsx scripts/migrate-articles-to-db.ts
 */

import { articles, type ArticleBlock } from '../src/lib/data/articles'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

function blocksToHtml(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'p':
          return `<p>${block.html}</p>`
        case 'h2':
          return `<h2>${block.text}</h2>`
        case 'h3':
          return `<h3>${block.text}</h3>`
        case 'ul':
          return `<ul>${block.items.map((item) => `<li>${item}</li>`).join('')}</ul>`
        case 'blockquote':
          return `<blockquote>${block.html}</blockquote>`
        case 'table':
          return `<table><thead><tr>${block.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        default:
          return ''
      }
    })
    .join('\n')
}

function escSql(str: string): string {
  return str.replace(/'/g, "''")
}

const lines: string[] = [
  '-- ============================================',
  '-- Seed blog_posts from static articles',
  '-- ============================================',
  '',
  '-- Avoid duplicates: only insert if slug does not exist',
]

for (const article of articles) {
  const html = blocksToHtml(article.body)

  lines.push('')
  lines.push(`INSERT INTO blog_posts (slug, title_lt, title_en, title_ru, excerpt_lt, excerpt_en, excerpt_ru, content_lt, content_en, content_ru, author, category, is_published, published_at, created_at, updated_at)`)
  lines.push(`SELECT '${escSql(article.slug)}',`)
  lines.push(`       '${escSql(article.title)}',`)
  lines.push(`       '${escSql(article.title)}',`)
  lines.push(`       '${escSql(article.title)}',`)
  lines.push(`       '${escSql(article.excerpt)}',`)
  lines.push(`       '${escSql(article.excerpt)}',`)
  lines.push(`       '${escSql(article.excerpt)}',`)
  lines.push(`       '${escSql(html)}',`)
  lines.push(`       '${escSql(html)}',`)
  lines.push(`       '${escSql(html)}',`)
  lines.push(`       NULL,`)
  lines.push(`       '${escSql(article.category)}',`)
  lines.push(`       true,`)
  lines.push(`       '${article.date}T12:00:00+00:00',`)
  lines.push(`       '${article.date}T12:00:00+00:00',`)
  lines.push(`       now()`)
  lines.push(`WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = '${escSql(article.slug)}');`)
}

const outPath = resolve(__dirname, '../supabase/migrations/011_seed_blog_posts.sql')
writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8')

console.log(`✓ Sugeneruota: ${outPath}`)
console.log(`  ${articles.length} straipsniai konvertuoti.`)
