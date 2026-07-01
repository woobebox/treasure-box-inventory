export type Role = 'admin' | 'member';
export type MemberStatus = 'invited' | 'active' | 'removed';
export type ItemStatus = 'active' | 'archived' | 'deleted';
export type SyncStatus = 'pending' | 'pushing' | 'synced' | 'failed' | 'conflicted';

export interface EntityBase { id: string; householdId: string; createdAt: string; updatedAt: string; deletedAt?: string | null; version?: number; }
export interface Household { id: string; name: string; createdBy: string; createdAt: string; updatedAt: string; deletedAt?: string | null; }
export interface HouseholdMember extends EntityBase { userId: string; role: Role; status: MemberStatus; invitedBy?: string | null; joinedAt?: string | null; removedAt?: string | null; }
export interface Location extends EntityBase { parentId?: string | null; type: string; name: string; path: string; sortOrder: number; }
export interface Item extends EntityBase { createdBy: string; updatedBy: string; currentLocationId: string; coverPhotoId?: string | null; name: string; normalizedName: string; category: string; status: ItemStatus; notes?: string; }
export interface Photo extends EntityBase { itemId: string; storageKey: string; thumbKey: string; localMainBlobKey?: string | null; localThumbBlobKey?: string | null; width: number; height: number; mimeType: string; byteSize: number; thumbByteSize: number; exifStripped: true; originalRetained: false; takenAt?: string | null; }
export interface Tag extends EntityBase { name: string; normalizedName: string; }
export interface ItemTag { itemId: string; tagId: string; householdId: string; createdAt: string; }
export interface HistoryEntry { id: string; householdId: string; itemId?: string | null; actorId: string; action: string; fromLocationId?: string | null; toLocationId?: string | null; changedFields: Record<string, unknown>; deviceId: string; occurredAt: string; }
export interface SyncOp { id: string; householdId: string; actorId: string; deviceId: string; opType: string; entityType: string; entityId: string; baseVersion?: number | null; payload: Record<string, unknown>; status: SyncStatus; retryCount: number; lastError?: string | null; createdAt: string; updatedAt: string; syncedAt?: string | null; }
export interface DeviceSync { householdId: string; deviceId: string; pullCursor?: string | null; lastPulledAt?: string | null; }
export interface ConflictRecord extends EntityBase { syncOpId: string; entityType: string; entityId: string; localPayload: Record<string, unknown>; remotePayload: Record<string, unknown>; resolvedAt?: string | null; }
export interface AppSetting { key: string; householdId?: string; value: unknown; updatedAt: string; }
