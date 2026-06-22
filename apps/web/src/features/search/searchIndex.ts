import type { Item, Location, Tag } from '../../domain/types';
import { normalizeText } from '../../domain/utils';

export function indexItemText(item: Item, tags: Tag[] = [], location?: Location): string {
  return normalizeText([item.name, item.category, item.notes ?? '', item.status, location?.path ?? '', ...tags.map((tag) => tag.name)].join(' '));
}
export function textMatches(indexedText: string, query: string): boolean { return !query.trim() || indexedText.includes(normalizeText(query)); }
