# Data Model: Local-first PWA Photo Inventory

## Entity Overview

| Entity | Purpose | Scope |
|---|---|---|
| `households` | Shared inventory boundary | Cloud + local |
| `household_members` | User membership and role | Cloud + local cache |
| `items` | Inventory object | Household |
| `locations` | Tree nodes for rooms/cabinets/drawers/boxes | Household |
| `photos` | Compressed main image and thumbnail metadata | Household/item |
| `tags` | User-defined labels | Household |
| `item_tags` | Many-to-many item/tag link | Household |
| `history` | Auditable item/location/photo changes | Household |
| `sync_ops` | Local-first outbox operations | Household/device |
| `device_sync` | Pull cursor per household/device | Household/device |
| `conflicts` | Version or permission conflict records | Household |
| `backup_snapshots` | Export/backup metadata | Household |
| `settings` | Local app preferences | Device/local |

## Relationships

- A `household` has many `household_members`, `items`, `locations`, `tags`, `history`, `sync_ops`, and `backup_snapshots`.
- A `household_member` references one Supabase Auth user and one household.
- An `item` belongs to one household and optionally one current `location` and one cover `photo`.
- A `location` belongs to one household and may have one parent location.
- A `photo` belongs to one household and one item.
- A `tag` belongs to one household; `item_tags` links tags to items.
- `history` entries record actor, action, changed fields, and movement source/destination.
- `sync_ops` and `device_sync` are keyed by `household_id` and `device_id`.

## Validation Rules

### Household Membership

- `role` must be `admin` or `member`.
- `status` must be `invited`, `active`, or `removed`.
- Only active members may access household data.
- Only admins may invite/remove members, delete data, or restore data.
- Members may create, edit, and move items and locations but may not delete or manage members.

### Items

- `household_id`, `created_by`, `name`, `status`, `version`, `created_at`, and `updated_at` are required.
- `current_location_id`, when present, must reference a location in the same household.
- `cover_photo_id`, when present, must reference a photo on the same item and household.
- `deleted_at` enables soft delete; rows are restorable for 30 days.
- Cleanup may permanently delete rows when `deleted_at < now() - 30 days`.

### Locations

- `household_id`, `type`, `name`, `path`, `sort_order`, and timestamps are required.
- `parent_id`, when present, must reference a location in the same household.
- The location tree must prevent cycles.
- Soft delete must not orphan active child locations or active items without an explicit move/archive flow.

### Photos

- Only compressed main image and thumbnail may be persisted.
- `original_retained` must be `false` in MVP.
- `exif_stripped` should be `true` after canvas re-encoding or equivalent processing.
- Storage keys must be private and scoped by `household_id`.
- Photo blobs and metadata follow the same 30-day cleanup behavior as their item when soft-deleted.

### Sync Operations

- Every cloud-affecting mutation creates a SyncOp in the same IndexedDB transaction as the local change.
- SyncOp payload must include `household_id`, `entity_type`, `entity_id`, `op_type`, `base_version`, `device_id`, and actor.
- Edge Functions must reject SyncOps when membership is inactive, role is insufficient, or payload household does not match the target row.

## State Transitions

```text
Item: active → soft_deleted → restored
Item: active → soft_deleted → permanently_deleted after 30 days
SyncOp: pending → pushing → synced
SyncOp: pending/pushing → failed → pending retry
SyncOp: pending/pushing → conflicted → resolved → pending/synced
Member: invited → active → removed
```
