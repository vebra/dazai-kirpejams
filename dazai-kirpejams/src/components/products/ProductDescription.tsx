type Block =
  | { type: 'heading'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'para'; text: string }

const BULLET_RE = /^[✅✓✔•·▪\-–]\s*/

function isHeading(l: string): boolean {
  // Trumpa eilutė, pasibaigianti „?" arba „:" — laikoma skyriaus antrašte.
  return l.length <= 60 && (l.endsWith('?') || l.endsWith(':'))
}

function parse(raw: string): Block[] {
  const lines = raw.replace(/\r/g, '').split('\n').map((l) => l.trim())
  const blocks: Block[] = []
  let bullets: string[] = []
  let para: string[] = []

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push({ type: 'bullets', items: bullets })
      bullets = []
    }
  }
  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'para', text: para.join('\n') })
      para = []
    }
  }

  for (const l of lines) {
    if (!l) continue
    if (BULLET_RE.test(l)) {
      flushPara()
      bullets.push(l.replace(BULLET_RE, '').trim())
      continue
    }
    flushBullets()
    if (isHeading(l)) {
      flushPara()
      blocks.push({ type: 'heading', text: l })
    } else {
      para.push(l)
    }
  }
  flushPara()
  flushBullets()
  return blocks
}

/**
 * Atvaizduoja produkto aprašymą tvarkingai: skyrių antraštės paryškintos,
 * ✅/✓ punktai — dviejų stulpelių sąrašas su žymekliais, pastraipos riboto
 * pločio (skaitomumui). Pertekliniai tarpai pašalinami.
 */
export function ProductDescription({ text }: { text: string }) {
  const blocks = parse(text)
  return (
    <div className="text-[0.95rem]">
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <h3
              key={i}
              className="text-[1.05rem] font-bold text-brand-gray-900 mt-6 first:mt-0 mb-2.5"
            >
              {b.text}
            </h3>
          )
        }
        if (b.type === 'bullets') {
          return (
            <ul
              key={i}
              className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mb-3 max-w-4xl"
            >
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2.5 text-brand-gray-600 leading-snug">
                  <span className="mt-0.5 text-brand-magenta font-bold shrink-0">✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p
            key={i}
            className="text-brand-gray-500 leading-[1.7] mb-3 max-w-3xl whitespace-pre-line"
          >
            {b.text}
          </p>
        )
      })}
    </div>
  )
}
