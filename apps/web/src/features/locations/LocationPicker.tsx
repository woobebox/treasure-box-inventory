import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Location } from '../../domain/types';
import { createLocation, listLocationsByHousehold } from '../../db/locationRepository';
import { listLocationTypeOptions, type LocationTypeOption } from '../../db/optionRepository';
import { Button, IconButton } from '../../components/ui';

interface Props {
  householdId: string;
  value: string;
  onChange: (locationId: string) => void;
  required?: boolean;
  actorId?: string;
  deviceId?: string;
  errorId?: string;
}

export function LocationPicker({ householdId, value, onChange, required = false, actorId, deviceId, errorId }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [typeOptions, setTypeOptions] = useState<LocationTypeOption[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('room');
  const [parentId, setParentId] = useState('');
  const [message, setMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  async function reload(): Promise<void> {
    const [nextLocations, nextTypes] = await Promise.all([
      listLocationsByHousehold(householdId),
      listLocationTypeOptions(householdId),
    ]);
    setLocations(nextLocations);
    setTypeOptions(nextTypes);
  }

  useEffect(() => {
    void Promise.all([listLocationsByHousehold(householdId), listLocationTypeOptions(householdId)]).then(([nextLocations, nextTypes]) => {
      setLocations(nextLocations);
      setTypeOptions(nextTypes);
    });
  }, [householdId]);

  async function addLocation(): Promise<void> {
    setMessage('');
    try {
      const location = await createLocation({
        householdId,
        name,
        type,
        parentId: parentId || null,
        actorId,
        deviceId,
      });
      await reload();
      onChange(location.id);
      setName('');
      setParentId('');
      setIsAdding(false);
      setMessage(`已新增並選擇位置「${location.path}」。`);
      requestAnimationFrame(() => selectRef.current?.focus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '新增位置失敗');
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700" htmlFor="item-location">位置{required && <span className="text-rose-500"> *</span>}</label>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
        <select ref={selectRef} id="item-location" required={required} aria-invalid={Boolean(errorId)} aria-describedby={errorId} value={value} onChange={(event) => onChange(event.target.value)} className="field-control w-full">
          <option value="">選擇位置</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}
        </select>
        <IconButton type="button" title={isAdding ? '取消新增位置' : '新增位置'} aria-label={isAdding ? '取消新增位置' : '新增位置'} onClick={() => { setIsAdding((current) => !current); setMessage(''); }}>{isAdding ? <X aria-hidden="true" className="h-5 w-5" /> : <Plus aria-hidden="true" className="h-5 w-5" />}</IconButton>
      </div>
      {isAdding ? <div className="reveal-panel space-y-3 rounded-3xl border border-teal-100 bg-teal-50/60 p-4">
        <input aria-label="快速新增位置名稱" value={name} onChange={(event) => setName(event.target.value)} placeholder="位置名稱" className="field-control w-full text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="快速新增位置類型" value={type} onChange={(event) => setType(event.target.value)} className="field-control min-w-0 text-sm">
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label="快速新增上層位置" value={parentId} onChange={(event) => setParentId(event.target.value)} className="field-control min-w-0 text-sm">
            <option value="">無上層位置</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}
          </select>
        </div>
        <Button type="button" variant="secondary" fullWidth onClick={() => void addLocation()}>建立並選擇</Button>
      </div> : null}
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
    </div>
  );
}
