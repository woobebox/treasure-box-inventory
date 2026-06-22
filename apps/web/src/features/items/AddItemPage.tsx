import { type FormEvent, useState } from 'react';
import { TagPicker } from '../tags/TagPicker';
import { createItem } from './createItem';
import { useItemForm } from './useItemForm';

const demoHouseholdId = 'local-demo-household';
const demoUserId = 'local-demo-user';
const demoDeviceId = 'local-demo-device';

export function AddItemPage() {
  const { state, setState, errors, isValid } = useItemForm();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setMessage('');
    try {
      const result = await createItem({
        householdId: demoHouseholdId,
        createdBy: demoUserId,
        updatedBy: demoUserId,
        deviceId: demoDeviceId,
        name: state.name,
        category: state.category,
        currentLocationId: state.locationId,
        notes: state.notes,
        dueAt: state.dueAt || null,
        tagNames: state.tagNames
      });
      setMessage(`已離線儲存物品，待同步作業 ${result.syncOp.id.slice(0, 8)} 已建立。`);
      setState({ name: '', category: '', locationId: '', notes: '', dueAt: '', tagNames: [] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-name">Name</label>
        <input id="item-name" value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-category">Category</label>
        <input id="item-category" value={state.category} onChange={(event) => setState({ ...state, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-location">Location ID</label>
        <input id="item-location" value={state.locationId} onChange={(event) => setState({ ...state, locationId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="location-id" />
        {errors.locationId && <p className="mt-1 text-xs text-red-600">{errors.locationId}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-notes">Notes</label>
        <textarea id="item-notes" value={state.notes} onChange={(event) => setState({ ...state, notes: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="item-due">Due date</label>
        <input id="item-due" type="date" value={state.dueAt} onChange={(event) => setState({ ...state, dueAt: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
      </div>
      <TagPicker selected={state.tagNames} onChange={(tagNames) => setState({ ...state, tagNames })} />
      <button disabled={!isValid || saving} className="w-full rounded-2xl bg-teal-700 px-4 py-3 font-semibold text-white disabled:bg-slate-300">{saving ? 'Saving locally...' : 'Save offline'}</button>
      {message && <p className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
    </form>
  );
}
