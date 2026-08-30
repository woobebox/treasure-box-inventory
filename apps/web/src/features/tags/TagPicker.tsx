import { useState } from 'react';
import { Button } from '../../components/ui';

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
      <label className="text-sm font-medium text-slate-700" htmlFor="tag-input">標籤</label>
      <div className="flex gap-2">
        <input id="tag-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} className="field-control min-w-0 flex-1" placeholder="工具、冬季用品..." />
        <Button type="button" onClick={addTag}>加入</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((tag) => <button key={tag} type="button" aria-label={`移除標籤 ${tag}`} onClick={() => onChange(selected.filter((value) => value !== tag))} className="min-h-11 rounded-full bg-teal-50 px-4 text-xs font-semibold text-teal-800 ring-1 ring-teal-100 hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">{tag} ×</button>)}
      </div>
    </div>
  );
}
