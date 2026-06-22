import { useEffect, useState } from 'react';
import type { Location } from '../../domain/types';
import { listItemsByHousehold } from '../../db/itemRepository';
import { listLocationsByHousehold } from '../../db/locationRepository';
import { LocationForm } from './LocationForm';
import { buildLocationTree, type LocationTreeNode } from './locationTree';

const demoHouseholdId = 'local-demo-household';
function Node({ node, onEdit }: { node: LocationTreeNode; onEdit: (location: Location) => void }) { return <li className="mt-2 rounded-2xl border border-slate-200 p-3"><button className="font-semibold text-teal-800" onClick={() => onEdit(node.location)}>{node.location.name}</button><p className="text-xs text-slate-500">{node.location.type} · {node.descendantItemCount} items including children</p>{node.children.length > 0 && <ul className="ml-4 border-l border-slate-200 pl-3">{node.children.map((child) => <Node key={child.location.id} node={child} onEdit={onEdit} />)}</ul>}</li>; }
export function LocationsPage() {
  const [tree, setTree] = useState<LocationTreeNode[]>([]); const [editing, setEditing] = useState<Location | null>(null);
  async function reload() { const [locations, items] = await Promise.all([listLocationsByHousehold(demoHouseholdId), listItemsByHousehold(demoHouseholdId)]); setTree(buildLocationTree(locations, items)); }
  useEffect(() => { void reload(); }, []);
  return <div className="space-y-5"><LocationForm householdId={demoHouseholdId} editing={editing} onSaved={() => { setEditing(null); void reload(); }} /><ul>{tree.map((node) => <Node key={node.location.id} node={node} onEdit={setEditing} />)}</ul></div>;
}
