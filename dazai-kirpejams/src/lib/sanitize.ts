import sanitizeHtmlLib from 'sanitize-html'

/**
 * Sanitize HTML content from the database before rendering with
 * dangerouslySetInnerHTML. Allows safe formatting tags (headings,
 * paragraphs, lists, tables, links, images, blockquotes) but strips
 * scripts, event handlers, iframes, and other dangerous elements.
 *
 * Uses `sanitize-html` (pure JS parser) instead of DOMPurify/jsdom —
 * jsdom cannot be bundled for or required from Vercel serverless
 * (ESM/CJS interop breakage in its dependency chain).
 */
export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
      'ul', 'ol', 'li',
      'a',
      'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'div', 'span',
      'figure', 'figcaption',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      '*': ['class', 'id'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    transformTags: {
      // Body content niekad neturi turėti H1 — page template'as renderinasi
      // savo H1 viršuje (post.title). Demote'inam autorių parašytą H1 → H2,
      // kad puslapis turėtų vienintelį H1. Veikia ant esamų ir būsimų postų
      // be DB migracijos.
      h1: 'h2',
    },
  })
}
