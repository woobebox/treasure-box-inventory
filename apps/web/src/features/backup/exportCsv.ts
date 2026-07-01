import type { Item } from '../../domain/types';

function escapeCsv(value: unknown): string { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function exportItemsCsv(items: Item[]): string {
  const headers = ['id', 'name', 'category', 'status', 'currentLocationId', 'createdAt', 'updatedAt'];
  return [headers.join(','), ...items.map((item) => headers.map((key) => escapeCsv(item[key as keyof Item])).join(','))].join('\n');
}
