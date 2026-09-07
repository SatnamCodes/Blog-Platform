import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import TableOfContents from '../components/TableOfContents.jsx';
import ShareLinks from '../components/ShareLinks.jsx';
import CommentSection from '../components/CommentSection.jsx';
import { extractHeadings } from '../lib/markdown.js';

export default function PostDetail() {
  const { slug } = useParams();
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  useEffect(() => {
    setStatus('loading');
    api
      .get(`/posts/${slug}`)
      .then(({ data }) => {
        setPost(data.post);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  const headings = useMemo(() => (post ? extractHeadings(post.content) : []), [post]);

  const toggleBookmark = async () => {
    if (!user || !post || bookmarkPending) return;
    const previous = bookmarked;
    setBookmarked(!previous); // optimistic
    setBookmarkPending(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/bookmark`);
      setBookmarked(data.bookmarked);
    } catch {
      setBookmarked(previous); // rollback
    } finally {
      setBookmarkPending(false);
    }
  };

  if (status === 'loading') return <div className="py-16 text-center text-slate-500">Loading post…</div>;
  if (status === 'error') return <div className="py-16 text-center text-red-600">Failed to load this post.</div>;
  if (!post) return null;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <article>
      <Helmet>
        <title>{post.title} — Blog Platform</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
      </Helmet>

      {/* Single h1 for the whole page; body headings inside the markdown
          start at h2+ conceptually, though authors control raw markdown so
          this is a best-effort convention, not enforced server-side. */}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-slate-500 mb-4">
        {post.author?.name} · {formatDate(post.publishedAt)} · {post.readingTime} min read · {post.views} views
      </p>

      <div className="flex items-center justify-between mb-6">
        <ShareLinks url={pageUrl} title={post.title} />
        {user && (
          <button onClick={toggleBookmark} className="text-sm hover:underline">
            {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
        )}
      </div>

      <TableOfContents headings={headings} />

      <MarkdownRenderer content={post.content} />

      {post.tags?.length > 0 && (
        <div className="mt-6 flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}

      <CommentSection postId={post._id} />
    </article>
  );
}

function formatDate(date) {
  if (!date) return 'Unpublished';
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
