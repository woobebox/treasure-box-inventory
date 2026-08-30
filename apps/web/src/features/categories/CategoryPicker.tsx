import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { addCategoryOption, listCategoryOptions } from '../../db/optionRepository';
import { Button, IconButton } from '../../components/ui';

interface CategoryPickerProps {
  householdId: string;
  value: string;
  onChange: (category: string) => void;
  required?: boolean;
  errorId?: string;
}

export function CategoryPicker({ householdId, value, onChange, required = false, errorId }: CategoryPickerProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  async function reload(): Promise<void> {
    setOptions(await listCategoryOptions(householdId));
  }

  useEffect(() => {
    void listCategoryOptions(householdId).then(setOptions);
  }, [householdId]);

  async function addOption(): Promise<void> {
    setMessage('');
    try {
      const category = await addCategoryOption(householdId, draft);
      setDraft('');
      onChange(category);
      await reload();
      setIsAdding(false);
      setMessage(`已新增分類「${category}」。`);
      requestAnimationFrame(() => selectRef.current?.focus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '新增分類失敗');
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor="item-category">分類{required && <span className="text-rose-500"> *</span>}</label>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
        <select ref={selectRef} id="item-category" required={required} aria-invalid={Boolean(errorId)} aria-describedby={errorId} value={value} onChange={(event) => onChange(event.target.value)} className="field-control w-full">
          <option value="">選擇分類</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <IconButton type="button" title={isAdding ? '取消新增分類' : '新增分類'} aria-label={isAdding ? '取消新增分類' : '新增分類'} onClick={() => { setIsAdding((current) => !current); setMessage(''); }}><>{isAdding ? <X aria-hidden="true" className="h-5 w-5" /> : <Plus aria-hidden="true" className="h-5 w-5" />}</></IconButton>
      </div>
      {isAdding ? <div className="flex gap-2 reveal-panel">
        <input aria-label="新增分類名稱" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="輸入新分類" className="field-control min-w-0 flex-1 text-sm" />
        <Button type="button" variant="secondary" onClick={() => void addOption()}>加入</Button>
      </div> : null}
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
