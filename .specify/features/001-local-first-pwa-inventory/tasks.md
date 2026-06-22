# Tasks: Local-first PWA Photo Inventory

- **Feature ID**: `001-local-first-pwa-inventory`
- **Source**: `deep-research-report.md`
- **Date**: 2026-06-22

## Phase 0: Specification Foundation

- [x] T001 Create feature directory `.specify/features/001-local-first-pwa-inventory/`.
- [x] T002 Create `specify.md` from `deep-research-report.md`.
- [x] T003 Create `plan.md` with architecture and technology decisions.
- [x] T004 Create `tasks.md` with implementation breakdown.

## Phase 1: Project Scaffold

- [ ] T101 Decide whether this repository will contain the PWA source directly or reference a subdirectory such as `apps/web`.
- [ ] T102 Initialize Vite + React + TypeScript project structure.
- [ ] T103 Add baseline scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`.
- [ ] T104 Add Tailwind CSS or selected UI system.
- [ ] T105 Add routing structure for Home, Locations, Add, Search, Settings, Item Detail.

## Phase 2: PWA Shell

- [ ] T201 Add Web App Manifest.
- [ ] T202 Add app icons and install metadata.
- [ ] T203 Add Workbox service worker registration.
- [ ] T204 Configure precache for App Shell.
- [ ] T205 Add offline fallback page.
- [ ] T206 Verify app opens after first load with network disabled.

## Phase 3: Local Data Layer

- [ ] T301 Add Dexie.js.
- [ ] T302 Define IndexedDB schema for items, photos, locations, tags, itemTags, history, syncOps, deviceSync, conflicts, settings.
- [ ] T303 Implement migration/versioning strategy.
- [ ] T304 Implement repository functions for Item CRUD.
- [ ] T305 Implement repository functions for Location CRUD.
- [ ] T306 Implement repository functions for Tag CRUD.
- [ ] T307 Implement local transaction helper that writes domain changes and SyncOps atomically.

## Phase 4: Item, Location, and Tag UI

- [ ] T401 Implement home dashboard with recent items, reminders, and sync status.
- [ ] T402 Implement item list and item detail screens.
- [ ] T403 Implement add/edit item form.
- [ ] T404 Implement location tree browser.
- [ ] T405 Implement location create/edit/delete UI.
- [ ] T406 Implement tag selection and tag management UI.
- [ ] T407 Implement item move flow and current location display.

## Phase 5: Photo Pipeline

- [ ] T501 Implement file upload fallback using `<input type="file" accept="image/*">`.
- [ ] T502 Implement camera capture using `getUserMedia()` where available.
- [ ] T503 Implement camera permission denied fallback.
- [ ] T504 Implement image decoding and canvas resizing.
- [ ] T505 Generate main image and thumbnail Blob.
- [ ] T506 Persist photo metadata and local Blob references.
- [ ] T507 Add cover photo selection.
- [ ] T508 Add retry state for photos not yet uploaded.

## Phase 6: Search and History

- [ ] T601 Add normalized search text fields.
- [ ] T602 Implement local keyword search.
- [ ] T603 Implement filters for tag, category, location, status, due date.
- [ ] T604 Implement history writer for create/edit/move/photo/delete events.
- [ ] T605 Implement history timeline on item detail.

## Phase 7: Supabase Cloud Layer

- [ ] T701 Add Supabase client configuration.
- [ ] T702 Create database migrations for items, photos, locations, tags, item_tags, history, device_sync, sync_ops.
- [ ] T703 Add RLS policies for owner-scoped access.
- [ ] T704 Create private storage bucket for item photos.
- [ ] T705 Implement signed upload/download or storage client integration.
- [ ] T706 Add authentication flow.

## Phase 8: Sync Engine

- [ ] T801 Define SyncOp payload schema.
- [ ] T802 Implement Outbox queue reader.
- [ ] T803 Implement push flow to Supabase Edge Function or direct table operations.
- [ ] T804 Implement server-side version validation.
- [ ] T805 Implement device cursor and pull changes flow.
- [ ] T806 Implement local application of remote changes.
- [ ] T807 Implement retry/backoff for failed sync.
- [ ] T808 Implement conflict queue.
- [ ] T809 Implement conflict resolution UI.
- [ ] T810 Add manual sync button and network restore sync trigger.

## Phase 9: Import, Export, Backup, Reminder

- [ ] T901 Implement JSON export.
- [ ] T902 Implement CSV export.
- [ ] T903 Define backup manifest format.
- [ ] T904 Implement JSON import with schema validation.
- [ ] T905 Implement backup restore dry-run preview.
- [ ] T906 Implement due date and reminder fields.
- [ ] T907 Implement App-internal reminder list.
- [ ] T908 Optionally implement notification permission flow.

## Phase 10: Verification and Hardening

- [ ] T1001 Add unit tests for local repositories.
- [ ] T1002 Add unit tests for SyncOp creation.
- [ ] T1003 Add integration tests for offline add/search/move.
- [ ] T1004 Add Playwright smoke tests for main flows.
- [ ] T1005 Run Lighthouse PWA audit.
- [ ] T1006 Test Chrome/Edge Android.
- [ ] T1007 Test Safari iOS/iPadOS behavior.
- [ ] T1008 Test desktop Chrome/Edge/Safari.
- [ ] T1009 Verify storage quota display and persistent storage request.
- [ ] T1010 Verify denied camera and denied notification fallbacks.

## Phase 11: Future Enhancements

- [ ] T1101 Add household membership and sharing.
- [ ] T1102 Add Web Share Target for sending photos into the app.
- [ ] T1103 Add OCR search.
- [ ] T1104 Add AI-assisted categorization.
- [ ] T1105 Add barcode/QR scanning.
- [ ] T1106 Evaluate CRDT only if real-time collaborative editing becomes necessary.
