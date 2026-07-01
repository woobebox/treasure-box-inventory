// Pure field-name mappers between the web app's camelCase domain objects
// (see apps/web/src/domain/types.ts) and the Postgres snake_case rows
// (see supabase/migrations/002_inventory_core.sql, 003_sync_history_backup.sql).
//
// These are intentionally dependency-free pure functions so they can be
// imported both by the Deno Edge Functions (push.ts / changes.ts) and by the
// Vitest/Node test suite (src/test/sync-mapping.test.ts).
//
// Conversion is SHALLOW on purpose: only top-level keys are renamed, values are
// passed through untouched. This keeps JSONB columns such as `changed_fields`
// intact instead of recursively rewriting their inner keys.

export type Row = Record<string, unknown>;
export type Entity = Record<string, unknown>;

function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/** camelCase domain object -> snake_case DB row (shallow). */
export function camelToRow(entity: Entity): Row {
  const row: Row = {};
  for (const [key, value] of Object.entries(entity)) {
    if (value === undefined) continue;
    row[camelToSnakeKey(key)] = value;
  }
  return row;
}

/** snake_case DB row -> camelCase domain object (shallow). */
export function rowToCamel(row: Row): Entity {
  const entity: Entity = {};
  for (const [key, value] of Object.entries(row)) {
    entity[snakeToCamelKey(key)] = value;
  }
  return entity;
}

// Entity types handled by the sync API. Order matters for push (parents first).
export const SYNC_ENTITIES = ['locations', 'items', 'photos', 'tags', 'item_tags', 'history'] as const;
export type SyncEntity = (typeof SYNC_ENTITIES)[number];
