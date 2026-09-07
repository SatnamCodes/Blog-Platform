import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { sanitizeHtml } from '../lib/markdown.js';

// Renders markdown through react-markdown's AST pipeline (remark-gfm for
// tables/strikethrough/task lists, rehype-highlight for code blocks), then
// as a final defensive layer sanitizes the resulting HTML string with
// DOMPurify before anything reaches the DOM. The server already strips raw
// HTML from stored markdown on save, so this is layer two, not the only
// line of defense.
export default function MarkdownRenderer({ content, headingIdPrefix = '' }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: (props) => <HeadingWithId level={1} prefix={headingIdPrefix} {...props} />,
          h2: (props) => <HeadingWithId level={2} prefix={headingIdPrefix} {...props} />,
          h3: (props) => <HeadingWithId level={3} prefix={headingIdPrefix} {...props} />,
          h4: (props) => <HeadingWithId level={4} prefix={headingIdPrefix} {...props} />,
          h5: (props) => <HeadingWithId level={5} prefix={headingIdPrefix} {...props} />,
          h6: (props) => <HeadingWithId level={6} prefix={headingIdPrefix} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function slugifyText(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function HeadingWithId({ level, prefix, children, ...props }) {
  const Tag = `h${level}`;
  const text = Array.isArray(children) ? children.join('') : children;
  const id = `${prefix}${slugifyText(String(text))}`;
  return (
    <Tag id={id} {...props}>
      {children}
    </Tag>
  );
}

// Exposed for any raw-HTML-string render path (not the primary AST path
// above, but kept for completeness / potential SSR use).
export function renderSanitized(html) {
  return { __html: sanitizeHtml(html) };
}
