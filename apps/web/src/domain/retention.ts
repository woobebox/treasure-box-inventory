export const SOFT_DELETE_RETENTION_DAYS = 30;

export function expiresAfterSoftDelete(deletedAtIso: string): string {
  const expiresAt = new Date(deletedAtIso);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + SOFT_DELETE_RETENTION_DAYS);
  return expiresAt.toISOString();
}
