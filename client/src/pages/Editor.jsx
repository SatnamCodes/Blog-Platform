import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { computeWordStats } from '../lib/markdown.js';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';
import MarkdownRenderer from '../components/MarkdownRenderer.jsx';
import EditorToolbar from '../components/EditorToolbar.jsx';
import TagInput from '../components/TagInput.jsx';

export default function Editor() {
  const { slug } = useParams();
  const isEditing = Boolean(slug);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const textareaRef = useRef(null);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { title: '', content: '', excerpt: '', tags: [], status: 'draft' },
  });

  const [postId, setPostId] = useState(null);
  const [loadStatus, setLoadStatus] = useState(isEditing ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const content = watch('content');
  const tags = watch('tags');
  const { wordCount, readingTime } = computeWordStats(content);

  useEffect(() => {
    if (!isEditing) return;
    api
      .get(`/posts/${slug}`)
      .then(({ data }) => {
        const post = data.post;
        if (post.author?._id !== user?.id) {
          setLoadError('You do not own this post.');
          setLoadStatus('error');
          return;
        }
        setPostId(post._id);
        setValue('title', post.title);
        setValue('content', post.content);
        setValue('excerpt', post.excerpt);
        setValue('tags', post.tags);
        setValue('status', post.status);
        setLoadStatus('ready');
      })
      .catch(() => {
        setLoadError('Failed to load post.');
        setLoadStatus('error');
      });
  }, [isEditing, slug, setValue, user]);

  // Trailing-edge debounced auto-save-as-draft. Fires 1.5s after the user
  // stops typing so we don't hit the API on every keystroke.
  const autoSave = useDebouncedCallback(async (values) => {
    if (!values.title.trim() || !values.content.trim()) return;
    setSaveState('saving');
    try {
      const payload = { ...values, status: values.status === 'published' ? 'published' : 'draft' };
      if (postId) {
        const { data } = await api.put(`/posts/${postId}`, payload);
        setSaveState('saved');
        return data.post;
      } else {
        const { data } = await api.post('/posts', { ...payload, status: 'draft' });
        setPostId(data.post._id);
        setSaveState('saved');
        return data.post;
      }
    } catch {
      setSaveState('error');
      return null;
    }
  }, 1500);

  const handleFieldChange = useCallback(
    (field, value) => {
      setValue(field, value);
      autoSave({ ...watch(), [field]: value });
    },
    [setValue, watch, autoSave]
  );

  const insertImage = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const el = textareaRef.current;
      const insertion = `![${file.name}](${data.url})`;
      const newValue = el
        ? content.slice(0, el.selectionStart) + insertion + content.slice(el.selectionEnd)
        : `${content}\n${insertion}`;
      handleFieldChange('content', newValue);
    } catch {
      setSubmitError('Image upload failed (Cloudinary may not be configured).');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (status) => {
    setSubmitError('');
    const values = watch();
    if (!values.title.trim() || !values.content.trim()) {
      setSubmitError('Title and content are required.');
      return;
    }
    try {
      const payload = { ...values, status };
      let post;
      if (postId) {
        const { data } = await api.put(`/posts/${postId}`, payload);
        post = data.post;
      } else {
        const { data } = await api.post('/posts', payload);
        post = data.post;
      }
      navigate(`/post/${post.slug}`);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to save post.');
    }
  };

  if (loadStatus === 'loading') return <div className="py-16 text-center text-slate-500">Loading editor…</div>;
  if (loadStatus === 'error') return <div className="py-16 text-center text-red-600">{loadError}</div>;

  return (
    <form onSubmit={handleSubmit(() => onSubmit(watch('status')))} className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit post' : 'Write a new post'}</h1>
        <SaveStatus state={saveState} />
      </div>

      <input
        {...register('title')}
        onChange={(e) => handleFieldChange('title', e.target.value)}
        placeholder="Post title"
        className="w-full text-2xl font-semibold border-b mb-4 px-1 py-2 bg-transparent dark:border-slate-700"
      />

      <input
        {...register('excerpt')}
        onChange={(e) => handleFieldChange('excerpt', e.target.value)}
        placeholder="Short excerpt (optional)"
        className="w-full border rounded px-3 py-2 mb-4 text-sm dark:bg-slate-800 dark:border-slate-700"
      />

      <div className="mb-4">
        <TagInput tags={tags} onChange={(t) => handleFieldChange('tags', t)} />
      </div>

      <EditorToolbar
        textareaRef={textareaRef}
        onChange={(v) => handleFieldChange('content', v)}
        onInsertImage={insertImage}
        uploadingImage={uploadingImage}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-t-0 rounded-b dark:border-slate-700">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleFieldChange('content', e.target.value)}
          placeholder="Write your post in Markdown…"
          className="min-h-[400px] p-3 font-mono text-sm bg-transparent resize-none focus:outline-none border-r dark:border-slate-700"
        />
        <div className="p-3 overflow-auto min-h-[400px]">
          <MarkdownRenderer content={content || '*Nothing to preview yet*'} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-slate-500">
          {wordCount} words · {readingTime} min read
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSubmit('draft')}
            className="border rounded px-4 py-2 text-sm dark:border-slate-700"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => onSubmit('published')}
            className="bg-slate-900 text-white rounded px-4 py-2 text-sm dark:bg-slate-100 dark:text-slate-900"
          >
            Publish
          </button>
        </div>
      </div>
      {submitError && <p className="text-red-600 text-sm mt-2">{submitError}</p>}
    </form>
  );
}

function SaveStatus({ state }) {
  if (state === 'saving') return <span className="text-xs text-slate-500">Saving…</span>;
  if (state === 'saved') return <span className="text-xs text-green-600">Saved</span>;
  if (state === 'error') return <span className="text-xs text-red-600">Save failed</span>;
  return null;
}
