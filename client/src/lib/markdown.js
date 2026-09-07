import DOMPurify from 'dompurify';

// Client-side sanitization layer (second layer - the server already
// strips raw HTML from stored markdown on save). This runs on the actual
// rendered HTML output from react-markdown right before it hits the DOM,
// so even markdown-driven constructs (e.g. an <img onerror=...> slipped
// through as an HTML block) get neutralized at render time too.
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}

export function computeWordStats(markdown) {
  const text = (markdown || '').trim();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTime };
}

// Parses markdown heading lines (# .. ######) into a flat list for a
// table of contents, generating GitHub-style anchor slugs.
export function extractHeadings(markdown) {
  const lines = (markdown || '').split('\n');
  const headings = [];
  const seen = new Map();
  for (const line of lines) {
    const match = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (!match) continue;
    const depth = match[1].length;
    const text = match[2].trim();
    let slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;
    headings.push({ depth, text, slug });
  }
  return headings;
}
