# Research: Local-first PWA Photo Inventory

## Decision: MVP uses household-scoped data instead of owner-only data

- **Rationale**: The clarified MVP requires small household sharing without real-time collaboration. `household_id` provides a stable authorization, sync, backup, and export boundary.
- **Alternatives considered**:
  - Owner-only rows: simpler, but would require disruptive migration when household sharing lands.
  - Full collaborative sharing/CRDT: too complex for MVP and explicitly out of scope.

## Decision: Two-role authorization model (`admin`, `member`)

- **Rationale**: Two roles satisfy least privilege for common household workflows. Admins manage members and destructive actions; members can contribute inventory updates without delete/member-management rights.
- **Alternatives considered**:
  - Read-only members: safer but does not support household co-maintenance.
  - Admin/editor/viewer: more flexible but adds ACL complexity before a real need exists.

## Decision: Supabase is the MVP cloud backend

- **Rationale**: Supabase Auth, Postgres/RLS, Storage, and Edge Functions map directly to identity, row-level authorization, private image storage, and controlled SyncOp validation.
- **Alternatives considered**:
  - Local-only MVP: reduces scope but violates cross-device sync goal.
  - Vendor-abstracted cloud layer: increases abstraction work before product behavior is validated.

## Decision: Store only compressed main image and thumbnail

- **Rationale**: Original photos increase storage cost, sync time, backup size, and EXIF privacy exposure. Canvas re-encoding can avoid retaining original EXIF metadata.
- **Alternatives considered**:
  - Optional original retention: adds storage policy and privacy UX complexity.
  - Always retain original: unnecessary for MVP and conflicts with data minimization.

## Decision: Soft delete retention is fixed at 30 days

- **Rationale**: 30 days is a testable, user-friendly recovery window that balances accidental deletion recovery with storage and privacy retention limits.
- **Alternatives considered**:
  - 7 days: lower retention risk but less forgiving for household workflows.
  - Admin-configurable retention: flexible but adds policy UI and edge cases.
  - Permanent soft delete: increases privacy and storage risk.
