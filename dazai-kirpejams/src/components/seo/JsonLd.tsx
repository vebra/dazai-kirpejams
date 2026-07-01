/**
 * Paprastas JSON-LD įkėlimo komponentas.
 * Sukuria <script type="application/ld+json"> su schema.org objektu.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify neescapina '<' — tekstas su script pabaigos seka
      // (pvz. blogo antraštė iš DB) ištrūktų iš script tago. Next.js docs
      // (json-ld.md) reikalauja '<' keisti unicode escape'u — JSON'ui tai
      // tas pats simbolis, HTML parser'iui nebe tag'o pradžia.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
