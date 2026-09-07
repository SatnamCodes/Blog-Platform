export default function TableOfContents({ headings }) {
  if (!headings?.length) return null;
  return (
    <nav aria-label="Table of contents" className="mb-6 border rounded p-4 text-sm dark:border-slate-700">
      <p className="font-semibold mb-2">Contents</p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.slug} style={{ marginLeft: (h.depth - 1) * 12 }}>
            <a href={`#${h.slug}`} className="text-blue-600 hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
