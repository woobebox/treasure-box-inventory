import type { Item, Location } from '../../domain/types';

export interface LocationTreeNode { location: Location; children: LocationTreeNode[]; itemCount: number; descendantItemCount: number; }

export function buildLocationTree(locations: Location[], items: Item[] = []): LocationTreeNode[] {
  const nodes = new Map(locations.map((location) => [location.id, { location, children: [] as LocationTreeNode[], itemCount: items.filter((item) => item.currentLocationId === location.id && !item.deletedAt).length, descendantItemCount: 0 }]));
  const roots: LocationTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.location.parentId ? nodes.get(node.location.parentId) : undefined;
    if (parent) parent.children.push(node); else roots.push(node);
  }
  const sortNodes = (list: LocationTreeNode[]) => list.sort((a, b) => a.location.sortOrder - b.location.sortOrder || a.location.name.localeCompare(b.location.name)).forEach((node) => sortNodes(node.children));
  sortNodes(roots);
  const total = (node: LocationTreeNode): number => {
    node.descendantItemCount = node.itemCount + node.children.reduce((sum, child) => sum + total(child), 0);
    return node.descendantItemCount;
  };
  roots.forEach(total);
  return roots;
}

export function collectDescendantLocationIds(locations: Location[], rootId: string): string[] {
  const byParent = new Map<string, Location[]>();
  for (const location of locations) {
    if (!location.parentId) continue;
    byParent.set(location.parentId, [...(byParent.get(location.parentId) ?? []), location]);
  }
  const ids = [rootId];
  for (let index = 0; index < ids.length; index += 1) for (const child of byParent.get(ids[index]) ?? []) ids.push(child.id);
  return ids;
}
