/**
 * Paleidžia 011_seed_blog_posts.sql migraciją per Supabase service role.
 *
 * Paleisti: npx tsx scripts/run-migration-011.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { articles, type ArticleBlock } from '../src/lib/data/articles'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Trūksta NEXT_PUBLIC_SUPABASE_URL arba SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

async function main() {
  console.log(`Migrating ${articles.length} articles to blog_posts...\n`)

  let inserted = 0
  let skipped = 0

  for (const article of articles) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', article.slug)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭ "${article.slug}" — jau egzistuoja, praleidžiama`)
      skipped++
      continue
    }

    const html = blocksToHtml(article.body)

    const { error } = await supabase.from('blog_posts').insert({
      slug: article.slug,
      title_lt: article.title,
      title_en: article.title,
      title_ru: article.title,
      excerpt_lt: article.excerpt,
      excerpt_en: article.excerpt,
      excerpt_ru: article.excerpt,
      content_lt: html,
      content_en: html,
      content_ru: html,
      author: null,
      category: article.category,
      is_published: true,
      published_at: `${article.date}T12:00:00+00:00`,
      created_at: `${article.date}T12:00:00+00:00`,
    })

    if (error) {
      console.error(`  ✗ "${article.slug}" — klaida:`, error.message)
    } else {
      console.log(`  ✓ "${article.slug}" — įterptas`)
      inserted++
    }
  }

  console.log(`\nRezultatas: ${inserted} įterpti, ${skipped} praleisti.`)
}

main()
