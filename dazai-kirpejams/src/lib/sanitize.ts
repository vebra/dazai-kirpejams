import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content from the database before rendering with
 * dangerouslySetInnerHTML. Allows safe formatting tags (headings,
 * paragraphs, lists, tables, links, images, blockquotes) but strips
 * scripts, event handlers, iframes, and other dangerous elements.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
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
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'id',
      'colspan', 'rowspan', 'scope',
    ],
    ALLOW_DATA_ATTR: false,
  })
}
