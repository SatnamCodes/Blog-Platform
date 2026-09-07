import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <article className="border-b border-slate-200 dark:border-slate-800 py-5">
      <Link to={`/post/${post.slug}`} className="text-xl font-semibold hover:underline">
        {post.title}
      </Link>
      <p className="text-sm text-slate-500 mt-1">
        {post.author?.name || 'Unknown'} · {formatDate(post.publishedAt)} · {post.readingTime} min read
      </p>
      {post.excerpt && <p className="mt-2 text-slate-700 dark:text-slate-300">{post.excerpt}</p>}
      {post.tags?.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function formatDate(date) {
  if (!date) return 'Unpublished';
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
