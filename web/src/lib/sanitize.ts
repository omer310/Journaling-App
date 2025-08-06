import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults for rich text content
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'del', 'ins',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'img'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title', 'alt', 'src',
    'class', 'id', 'style', 'data-*',
    'dir', 'lang'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, purifyConfig);
}

/**
 * Sanitizes HTML content for search highlighting
 * Allows only basic formatting tags for search results
 */
export function sanitizeSearchHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  const searchConfig = {
    ...purifyConfig,
    ALLOWED_TAGS: ['mark', 'span', 'strong', 'em', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'style']
  };
  
  return DOMPurify.sanitize(html, searchConfig);
}

/**
 * Sanitizes HTML content for rich text editor display
 * Allows more formatting options for journal entries
 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  const richTextConfig = {
    ...purifyConfig,
    ALLOWED_TAGS: [
      ...purifyConfig.ALLOWED_TAGS,
      'sup', 'sub', 'small', 'big',
      'cite', 'q', 'abbr', 'acronym',
      'kbd', 'samp', 'var', 'tt'
    ]
  };
  
  return DOMPurify.sanitize(html, richTextConfig);
} 