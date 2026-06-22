import { useState } from 'react';

interface TagPickerProps { selected: string[]; onChange: (tags: string[]) => void; }

export function TagPicker({ selected, onChange }: TagPickerProps) {
  const [draft, setDraft] = useState('');
  const addTag = () => {
    const tag = draft.trim();
    if (!tag || selected.includes(tag) || tag.length > 40) return;
    onChange([...selected, tag]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor="tag-input">Tags</label>
      <div className="flex gap-2">
        <input id="tag-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2" placeholder="tools, winter..." />
        <button type="button" onClick={addTag} className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((tag) => <button key={tag} type="button" onClick={() => onChange(selected.filter((value) => value !== tag))} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">{tag} ×</button>)}
      </div>
    </div>
  );
}
