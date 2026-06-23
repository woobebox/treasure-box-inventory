# Quickstart Validation Guide: Local-first PWA Photo Inventory

## Prerequisites

- Node.js LTS and npm.
- Supabase project for cloud sync validation.
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Expected Commands

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run test
npm run preview
```

## Validation Scenarios

### 1. Offline item creation

1. Load the app once while online.
2. Disable network.
3. Add an item with name, location, tag, and photo.
4. Confirm the item appears in local search.
5. Reload the app and confirm the item persists from IndexedDB.

Expected result: local item and SyncOp are present; no data loss occurs offline.

### 2. Photo retention and privacy

1. Add a photo containing EXIF metadata.
2. Inspect local persisted photo records and blobs.
3. Inspect exported backup manifest.

Expected result: only compressed main image and thumbnail are present; original photo and original EXIF metadata are not persisted.

### 3. Household authorization

1. Create two households and two test users.
2. Verify user A cannot query household B rows through Supabase.
3. Add user A as `member` to household A.
4. Attempt member delete and member-management actions.

Expected result: member can create/edit/move but cannot delete or manage members; cross-household access is rejected by RLS/Edge Function checks.

### 4. Sync recovery

1. Create or edit an item while offline.
2. Restore network.
3. Trigger automatic or manual sync.

Expected result: pending SyncOp is pushed via Supabase Edge Function and marked synced with a server version.

### 5. Soft delete retention

1. Delete an item as admin.
2. Confirm it is restorable within 30 days.
3. Simulate `deleted_at` older than 30 days and run cleanup.

Expected result: item can be restored within the window and permanently deleted after retention expires.

## Phase 12 Verification Notes (2026-06-23)

- TypeScript, lint, Vitest smoke/unit coverage, production build, and whitespace checks were run locally after Phase 10 and Phase 11 implementation.
- Lighthouse PWA audit: production assets build successfully with the existing manifest, offline fallback, service worker registration, and Workbox runtime cache configuration. A browser-driven Lighthouse score capture still requires running Chrome DevTools or CI browser automation outside this shell.
- Chrome/Edge Android behavior: responsive app shell, file upload fallback, camera capture hint (`capture="environment"`), storage persistence request, and IndexedDB-backed offline flows are implemented in code. Physical Android validation remains a release-device checklist item.
- Safari iOS/iPadOS behavior: the photo flow uses standard `<input type="file" accept="image/*">` with camera capture hints and canvas JPEG re-encoding, and storage settings gracefully check `navigator.storage` availability. Physical iOS/iPadOS validation remains a release-device checklist item.
- Supabase authorization negative cases: RLS policies in `supabase/migrations/004_rls_policies.sql` remain the source of truth for household isolation; client admin-only delete/restore and member management paths deny non-admin members before mutation.
