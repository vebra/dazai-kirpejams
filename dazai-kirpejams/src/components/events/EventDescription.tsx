import type { ReactNode } from 'react'

/**
 * Renginio aprašymo atvaizdavimas su struktūra.
 *
 * Admin'as aprašymą rašo paprastu tekstu su eilučių lūžiais ir „•" sąrašo
 * ženklais (žr. /admin/renginiai formą). Anksčiau visas tekstas buvo kišamas
 * į vieną <p>, todėl HTML'e lūžiai suplakdavo į vientisą sieną. Čia tekstas
 * skaidomas: tuščios eilutės atskiria pastraipas, iš eilės einančios „•"
 * eilutės tampa <ul> sąrašu.
 */

/** Meta/og/schema laukams — suplaka lūžius į vieną eilutę. */
export function flattenDescription(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('•') || line.startsWith('-')) {
      const item = line.replace(/^[•-]\s*/, '')
      const last = blocks[blocks.length - 1]
      if (last?.type === 'list') {
        last.items.push(item)
      } else {
        blocks.push({ type: 'list', items: [item] })
      }
    } else {
      blocks.push({ type: 'paragraph', text: line })
    }
  }
  return blocks
}

export function EventDescription({
  text,
  className = '',
}: {
  text: string
  className?: string
}): ReactNode {
  const blocks = parseBlocks(text)
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, i) =>
        block.type === 'list' ? (
          <ul key={i} className="space-y-2 pl-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3">
                <span className="text-brand-magenta shrink-0 leading-relaxed">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{block.text}</p>
        )
      )}
    </div>
  )
}
