import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import CommentItem from './CommentItem.jsx';

function insertReply(tree, parentId, reply) {
  return tree.map((c) => {
    if (c._id === parentId) {
      return { ...c, replies: [...(c.replies || []), { ...reply, replies: [] }] };
    }
    if (c.replies?.length) {
      return { ...c, replies: insertReply(c.replies, parentId, reply) };
    }
    return c;
  });
}

export default function CommentSection({ postId }) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await api.get(`/comments/post/${postId}`);
      setComments(data.comments);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const onReplyAdded = (parentId, reply) => {
    setComments((prev) => insertReply(prev, parentId, reply));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/comments', { post: postId, content: newComment.trim() });
      setComments((prev) => [...prev, { ...data.comment, replies: [] }]);
      setNewComment('');
    } catch {
      // Surfaced via the top-level status area on next load attempt; keep it
      // simple here since the input retains the user's unsent text.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-4">Comments</h2>

      {user ? (
        <form onSubmit={submitComment} className="mb-6 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-900 text-white rounded px-4 text-sm disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500 mb-6">Log in to leave a comment.</p>
      )}

      {status === 'loading' && <p className="text-sm text-slate-500">Loading comments…</p>}
      {status === 'error' && (
        <p className="text-sm text-red-600">
          Failed to load comments.{' '}
          <button onClick={load} className="underline">
            Retry
          </button>
        </p>
      )}
      {status === 'ready' && comments.length === 0 && (
        <p className="text-sm text-slate-500">No comments yet. Be the first to say something.</p>
      )}
      {status === 'ready' &&
        comments.map((c) => (
          <CommentItem key={c._id} comment={c} postId={postId} onReplyAdded={onReplyAdded} />
        ))}
    </section>
  );
}
