import { useEffect, useState } from 'react';
import type { Location } from '../../domain/types';
import { listLocationsByHousehold } from '../../db/locationRepository';

interface Props { householdId: string; value: string; onChange: (locationId: string) => void; }

export function LocationPicker({ householdId, value, onChange }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  useEffect(() => { void listLocationsByHousehold(householdId).then(setLocations); }, [householdId]);
  return (
    <div>
      <label className="text-sm font-medium text-slate-700" htmlFor="item-location">Location</label>
      <select id="item-location" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
        <option value="">Select location</option>
        {locations.map((location) => <option key={location.id} value={location.id}>{location.path}</option>)}
      </select>
    </div>
  );
}
