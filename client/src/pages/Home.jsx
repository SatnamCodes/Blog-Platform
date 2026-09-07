import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PostCard from '../components/PostCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const params = { page, limit: 10 };
      if (tag) params.tag = tag;
      if (search) params.search = search;
      const { data } = await api.get('/posts', { params });
      setPosts(data.posts);
      setPagination(data.pagination);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [page, tag, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/tags')
      .then(({ data }) => setTags(data.tags))
      .catch(() => setTags([]));
  }, []);

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('search', value);
      else next.delete('search');
      next.set('page', '1');
      return next;
    });
  }, 400);

  const onSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const onTagClick = (t) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (t === tag) next.delete('tag');
      else next.set('tag', t);
      next.set('page', '1');
      return next;
    });
  };

  const onPageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={searchInput}
          onChange={onSearchChange}
          placeholder="Search posts…"
          className="border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700 w-full sm:w-64"
          aria-label="Search posts"
        />
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((t) => (
              <button
                key={t.tag}
                onClick={() => onTagClick(t.tag)}
                className={`text-xs rounded px-2 py-1 border dark:border-slate-700 ${
                  t.tag === tag ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''
                }`}
              >
                {t.tag} ({t.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {status === 'loading' && <div className="py-10 text-center text-slate-500">Loading posts…</div>}

      {status === 'error' && (
        <div className="py-10 text-center text-red-600">
          Failed to load posts.{' '}
          <button onClick={load} className="underline">
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && posts.length === 0 && (
        <div className="py-10 text-center text-slate-500">
          No posts found{search ? ` for "${search}"` : ''}{tag ? ` tagged "${tag}"` : ''}.
        </div>
      )}

      {status === 'ready' && posts.length > 0 && (
        <>
          <div>
            {posts.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={onPageChange} />
        </>
      )}
    </div>
  );
}
