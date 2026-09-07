/**
 * Server-side computation of wordCount / readingTime from raw markdown.
 * Kept server-side (not trusted from client) so these numbers can't be
 * spoofed and stay consistent regardless of which client renders them.
 */
export function computeWordStats(markdown) {
  const text = (markdown || '').trim();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTime };
}
