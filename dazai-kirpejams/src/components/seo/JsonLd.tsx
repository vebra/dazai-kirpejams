/**
 * Paprastas JSON-LD įkėlimo komponentas.
 * Sukuria <script type="application/ld+json"> su schema.org objektu.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Next.js rekomenduoja dangerouslySetInnerHTML JSON-LD įvedimui,
      // kad JSON nebūtų escape'inamas kaip HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
