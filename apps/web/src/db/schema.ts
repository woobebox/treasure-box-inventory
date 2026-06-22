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
