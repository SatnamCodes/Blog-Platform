import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

export default function CommentItem({ comment, postId, depth = 0, onReplyAdded }) {
  const user = useAuthStore((s) => s.user);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [likeError, setLikeError] = useState('');
  const [liking, setLiking] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!user || liking) return;
    setLikeError('');
    const previous = likeCount;
    // Optimistic update: bump the count immediately so liking feels instant,
    // then roll back to `previous` if the request actually fails.
    setLikeCount(previous + 1);
    setLiking(true);
    try {
      const { data } = await api.post(`/comments/${comment._id}/like`);
      setLikeCount(data.likeCount);
    } catch {
      setLikeCount(previous);
      setLikeError('Failed to like comment');
    } finally {
      setLiking(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/comments', {
        post: postId,
        content: replyText.trim(),
        parentComment: comment._id,
      });
      onReplyAdded(comment._id, data.comment);
      setReplyText('');
      setReplying(false);
    } catch {
      setLikeError('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-6 border-l pl-4 border-slate-200 dark:border-slate-800' : ''}>
      <div className="py-3">
        <p className="text-sm font-medium">{comment.author?.name || 'Unknown'}</p>
        <p className="text-sm mt-1">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <button onClick={handleLike} disabled={!user || liking} className="hover:underline disabled:opacity-50">
            👍 {likeCount}
          </button>
          {user && (
            <button onClick={() => setReplying((r) => !r)} className="hover:underline">
              Reply
            </button>
          )}
        </div>
        {likeError && <p className="text-red-600 text-xs mt-1">{likeError}</p>}
        {replying && (
          <form onSubmit={submitReply} className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-700"
              placeholder="Write a reply…"
            />
            <button
              type="submit"
              disabled={submitting}
              className="text-sm bg-slate-900 text-white rounded px-3 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              Post
            </button>
          </form>
        )}
      </div>
      {comment.replies?.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
