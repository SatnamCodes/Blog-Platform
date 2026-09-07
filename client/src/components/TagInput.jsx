import { useState } from 'react';

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const value = input.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 flex items-center gap-1"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder="Add a tag and press Enter"
        className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
      />
    </div>
  );
}
