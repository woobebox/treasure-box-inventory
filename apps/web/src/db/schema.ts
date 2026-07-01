export const schemaV1 = {
  households: 'id, name, createdBy, updatedAt, deletedAt',
  householdMembers: 'id, householdId, userId, role, status, updatedAt',
  items: 'id, householdId, normalizedName, category, status, currentLocationId, dueAt, updatedAt, deletedAt',
  photos: 'id, householdId, itemId, storageKey, thumbKey, deletedAt',
  locations: 'id, householdId, parentId, path, name, type, sortOrder, deletedAt',
  tags: 'id, householdId, normalizedName, deletedAt',
  itemTags: '[itemId+tagId], householdId, itemId, tagId',
  history: 'id, householdId, itemId, action, occurredAt',
  syncOps: 'id, householdId, status, entityType, entityId, createdAt, updatedAt',
  deviceSync: '[householdId+deviceId], householdId, deviceId',
  conflicts: 'id, householdId, syncOpId, entityType, entityId, resolvedAt',
  settings: '[householdId+key], householdId, key, updatedAt'
} as const;

// v2 adds a device-local store for photo thumbnail Blobs. This is intentionally
// NOT part of the sync surface (sync only carries metadata), so it never appears
// in syncOps payloads or the cloud schema.
export const schemaV2 = {
  photoBlobs: 'photoId'
} as const;
