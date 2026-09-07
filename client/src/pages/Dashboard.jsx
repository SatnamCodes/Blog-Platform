import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [filter, setFilter] = useState('all'); // all | draft | published
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await api.get('/posts/mine/all');
      setPosts(data.posts);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withRollback = async (id, optimisticUpdate, apiCall) => {
    const previous = posts;
    setPosts(optimisticUpdate(posts));
    setActionError('');
    try {
      await apiCall();
    } catch {
      setPosts(previous);
      setActionError('Action failed, changes reverted.');
    }
  };

  const publish = (post) =>
    withRollback(
      post._id,
      (list) => list.map((p) => (p._id === post._id ? { ...p, status: 'published' } : p)),
      () => api.patch(`/posts/${post._id}/publish`)
    );

  const unpublish = (post) =>
    withRollback(
      post._id,
      (list) => list.map((p) => (p._id === post._id ? { ...p, status: 'draft' } : p)),
      () => api.patch(`/posts/${post._id}/unpublish`)
    );

  const remove = (post) =>
    withRollback(
      post._id,
      (list) => list.filter((p) => p._id !== post._id),
      () => api.delete(`/posts/${post._id}`)
    );

  const visiblePosts = posts.filter((p) => filter === 'all' || p.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/write" className="bg-slate-900 text-white rounded px-4 py-2 text-sm dark:bg-slate-100 dark:text-slate-900">
          New post
        </Link>
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        {['all', 'draft', 'published'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded border dark:border-slate-700 ${
              filter === f ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {actionError && <p className="text-red-600 text-sm mb-3">{actionError}</p>}

      {status === 'loading' && <p className="text-slate-500">Loading your posts…</p>}
      {status === 'error' && (
        <p className="text-red-600">
          Failed to load your posts.{' '}
          <button onClick={load} className="underline">
            Retry
          </button>
        </p>
      )}
      {status === 'ready' && visiblePosts.length === 0 && (
        <p className="text-slate-500">No {filter !== 'all' ? filter : ''} posts yet.</p>
      )}

      {status === 'ready' && visiblePosts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b dark:border-slate-800">
                <th className="py-2">Title</th>
                <th className="py-2">Status</th>
                <th className="py-2">Views</th>
                <th className="py-2">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((post) => (
                <tr key={post._id} className="border-b dark:border-slate-800">
                  <td className="py-2">
                    <Link to={`/post/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-2 capitalize">{post.status}</td>
                  <td className="py-2">{post.views}</td>
                  <td className="py-2">{new Date(post.updatedAt).toLocaleDateString()}</td>
                  <td className="py-2 flex gap-3">
                    <Link to={`/edit/${post.slug}`} className="hover:underline">
                      Edit
                    </Link>
                    {post.status === 'draft' ? (
                      <button onClick={() => publish(post)} className="hover:underline">
                        Publish
                      </button>
                    ) : (
                      <button onClick={() => unpublish(post)} className="hover:underline">
                        Unpublish
                      </button>
                    )}
                    <button onClick={() => remove(post)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
