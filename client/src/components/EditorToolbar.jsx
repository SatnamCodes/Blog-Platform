const ACTIONS = [
  { label: 'B', title: 'Bold', wrap: '**' },
  { label: 'I', title: 'Italic', wrap: '_' },
  { label: '</>', title: 'Code', wrap: '`' },
  { label: 'H', title: 'Heading', prefix: '## ' },
  { label: '•', title: 'List', prefix: '- ' },
  { label: '🔗', title: 'Link', template: (sel) => `[${sel || 'link text'}](https://)` },
];

/**
 * Applies a markdown transform to the current textarea selection and
 * returns the new value + desired cursor position.
 */
function applyAction(value, selectionStart, selectionEnd, action) {
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);

  if (action.wrap) {
    const inserted = `${action.wrap}${selected || 'text'}${action.wrap}`;
    return { value: before + inserted + after, cursor: (before + inserted).length };
  }
  if (action.prefix) {
    const inserted = `${action.prefix}${selected}`;
    return { value: before + inserted + after, cursor: (before + inserted).length };
  }
  if (action.template) {
    const inserted = action.template(selected);
    return { value: before + inserted + after, cursor: (before + inserted).length };
  }
  return { value, cursor: selectionEnd };
}

export default function EditorToolbar({ textareaRef, onChange, onInsertImage, uploadingImage }) {
  const handleAction = (action) => {
    const el = textareaRef.current;
    if (!el) return;
    const { value, cursor } = applyAction(el.value, el.selectionStart, el.selectionEnd, action);
    onChange(value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="flex items-center gap-1 border rounded-t px-2 py-1 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
      {ACTIONS.map((action) => (
        <button
          key={action.title}
          type="button"
          title={action.title}
          onClick={() => handleAction(action)}
          className="px-2 py-1 text-sm rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {action.label}
        </button>
      ))}
      <label className="px-2 py-1 text-sm rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
        {uploadingImage ? 'Uploading…' : '🖼 Image'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploadingImage}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onInsertImage(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
