import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Server-side sanitization layer. We do not store raw markdown blindly:
// we render it to HTML with the same remark/rehype pipeline shape the
// client uses (a minimal markdown->HTML pass is not necessary here because
// we sanitize the *rendered* HTML on the client too - see client/src/lib/markdown.js).
// What we sanitize here is any raw HTML embedded inside the markdown itself,
// so a malicious <script> tag pasted into the editor cannot survive storage
// even if a future render path skips client sanitization.
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export function sanitizeMarkdownSource(markdown) {
  if (!markdown) return markdown;
  // Strip raw HTML tags that are not plain markdown syntax by purifying
  // any inline HTML blocks. We purify the whole string as HTML fragments;
  // DOMPurify safely no-ops on plain text/markdown syntax like # or *.
  return purify.sanitize(markdown, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote',
      'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'del',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
  });
}
