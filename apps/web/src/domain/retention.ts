export const SOFT_DELETE_RETENTION_DAYS = 30;
export const SOFT_DELETE_RETENTION_MS = SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function expiresAfterSoftDelete(deletedAtIso: string): string {
  const expiresAt = new Date(deletedAtIso);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + SOFT_DELETE_RETENTION_DAYS);
  return expiresAt.toISOString();
}

export function isWithinSoftDeleteRetention(deletedAtIso: string, now: Date = new Date()): boolean {
  return new Date(deletedAtIso).getTime() + SOFT_DELETE_RETENTION_MS >= now.getTime();
}

export function isExpiredSoftDelete(deletedAtIso: string, now: Date = new Date()): boolean {
  return !isWithinSoftDeleteRetention(deletedAtIso, now);
}
