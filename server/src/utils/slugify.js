/**
 * Small, dependency-free slugify util. Lowercases, strips diacritics,
 * replaces non-alphanumeric runs with a single hyphen, trims edge hyphens.
 */
export function slugify(input) {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '') || 'post';
}

/**
 * Generates a unique slug for a Post by repeatedly querying existing slugs
 * and appending -2, -3, ... until a free one is found. This is a proper
 * collision *loop* (not a single check) because two posts titled the same
 * thing, or a title colliding with an existing -N suffixed slug, must both
 * resolve correctly without a race producing duplicate slugs under normal
 * sequential request handling.
 *
 * @param {string} title
 * @param {import('mongoose').Model} PostModel
 * @param {string|null} excludeId - post id to exclude (for edits)
 */
export async function generateUniqueSlug(title, PostModel, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  // Query existing slugs that share the base as a prefix so we don't need
  // one query per candidate.
  const query = { slug: { $regex: `^${escapeRegex(base)}(-\\d+)?$` } };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await PostModel.find(query).select('slug').lean();
  const taken = new Set(existing.map((p) => p.slug));

  if (!taken.has(candidate)) return candidate;

  suffix = 2;
  candidate = `${base}-${suffix}`;
  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
