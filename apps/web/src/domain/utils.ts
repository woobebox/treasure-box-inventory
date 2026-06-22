const UUID_FALLBACK_PATTERN = '10000000-1000-4000-8000-100000000000';

export function nowIso(clock: Pick<DateConstructor, 'now'> = Date): string { return new Date(clock.now()).toISOString(); }
export function createId(): string { return crypto.randomUUID?.() ?? UUID_FALLBACK_PATTERN.replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)); }
export function normalizeText(value: string): string { return value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }
export function addDays(dateIso: string, days: number): string { const date = new Date(dateIso); date.setUTCDate(date.getUTCDate() + days); return date.toISOString(); }
export function isOlderThan(dateIso: string, days: number, referenceIso = nowIso()): boolean { return new Date(dateIso).getTime() < new Date(referenceIso).getTime() - days * 24 * 60 * 60 * 1000; }
