# Tasks: Local-first PWA Photo Inventory

- **Feature ID**: `001-local-first-pwa-inventory`
- **Source**: `deep-research-report.md`, clarified `specify.md`, updated `plan.md`, `data-model.md`, `contracts/`, `quickstart.md`
- **Date**: 2026-06-22
- **MVP Scope**: Household-scoped local-first PWA with offline add/search/move, compressed-photo-only retention, Supabase Auth/Postgres/RLS/Storage/Edge Function sync, and 30-day soft delete.

## Phase 1: Setup

- [x] T001 Create feature directory `.specify/features/001-local-first-pwa-inventory/`
- [x] T002 Create initial feature specification in `.specify/features/001-local-first-pwa-inventory/specify.md`
- [x] T003 Create initial implementation plan in `.specify/features/001-local-first-pwa-inventory/plan.md`
- [x] T004 Create initial task list in `.specify/features/001-local-first-pwa-inventory/tasks.md`
- [x] T005 Record clarification decisions in `.specify/features/001-local-first-pwa-inventory/specify.md`
- [x] T006 Update planning artifacts in `.specify/features/001-local-first-pwa-inventory/plan.md`, `.specify/features/001-local-first-pwa-inventory/research.md`, `.specify/features/001-local-first-pwa-inventory/data-model.md`, `.specify/features/001-local-first-pwa-inventory/contracts/`, and `.specify/features/001-local-first-pwa-inventory/quickstart.md`
- [x] T007 Scaffold Vite React TypeScript app in `apps/web/`
- [x] T008 Add root package scripts delegating to `apps/web/package.json`
- [x] T009 Add baseline scripts `dev`, `build`, `preview`, `lint`, `typecheck`, and `test` in `apps/web/package.json`
- [x] T010 Add Tailwind CSS and base theme files in `apps/web/tailwind.config.ts` and `apps/web/src/styles/global.css`
- [x] T011 Add application route shell in `apps/web/src/app/App.tsx`
- [x] T012 Add bottom navigation routes for Home, Locations, Add, Search, Settings, and Item Detail in `apps/web/src/app/routes.tsx`

## Phase 2: Foundational Architecture

- [x] T013 Define shared domain types for households, members, items, locations, photos, tags, history, sync ops, conflicts, and settings in `apps/web/src/domain/types.ts`
- [x] T014 Add local clock, UUID, normalization, and date retention helpers in `apps/web/src/domain/utils.ts`
- [x] T015 Configure Dexie database and schema versioning in `apps/web/src/db/database.ts`
- [x] T016 Add IndexedDB stores for `households`, `householdMembers`, `items`, `photos`, `locations`, `tags`, `itemTags`, `history`, `syncOps`, `deviceSync`, `conflicts`, and `settings` in `apps/web/src/db/schema.ts`
- [x] T017 Implement atomic local transaction helper that writes domain changes and SyncOps together in `apps/web/src/db/transactions.ts`
- [x] T018 Implement current household and role guard utilities in `apps/web/src/services/authorization.ts`
- [x] T019 Implement sync operation payload builders in `apps/web/src/sync/syncOpFactory.ts`
- [x] T020 Add app-level error and empty-state components in `apps/web/src/components/StatusState.tsx`
- [x] T021 Add Supabase client bootstrap without hard-coded secrets in `apps/web/src/services/supabaseClient.ts`
- [x] T022 Add environment variable documentation in `apps/web/.env.example`
- [x] T023 Add PWA manifest skeleton in `apps/web/public/manifest.webmanifest`
- [x] T024 Add service worker registration entry in `apps/web/src/pwa/registerServiceWorker.ts`

## Phase 3: User Story 1 - Offline item creation with photo

**Goal**: User can create an item with photo, name, location, and tags while offline, and the change is safely stored locally with an Outbox SyncOp.

**Independent Test**: Disable network, create a photo item, reload the app, and verify the item, compressed photo, thumbnail, metadata, history, and pending SyncOp remain in IndexedDB.

- [x] T025 [P] [US1] Implement item repository create/read/update helpers in `apps/web/src/db/itemRepository.ts`
- [x] T026 [P] [US1] Implement tag repository helpers in `apps/web/src/db/tagRepository.ts`
- [x] T027 [P] [US1] Implement photo metadata repository helpers in `apps/web/src/db/photoRepository.ts`
- [x] T028 [US1] Implement add item form state and validation in `apps/web/src/features/items/useItemForm.ts`
- [x] T029 [US1] Implement add item screen in `apps/web/src/features/items/AddItemPage.tsx`
- [x] T030 [US1] Implement tag picker component in `apps/web/src/features/tags/TagPicker.tsx`
- [x] T031 [US1] Wire item create transaction with photo metadata, tags, history, and SyncOp in `apps/web/src/features/items/createItem.ts`
- [x] T032 [US1] Add offline creation smoke test in `apps/web/src/test/offline-create-item.test.ts`

## Phase 4: User Story 2 - Household location tree

**Goal**: User can place items into a household location tree such as room, cabinet, drawer, hook, or box.

**Independent Test**: Create nested locations offline, add an item to a child location, and browse parent location results including child items.

- [x] T033 [P] [US2] Implement location repository with cycle prevention in `apps/web/src/db/locationRepository.ts`
- [x] T034 [US2] Implement location tree builder and descendant query helpers in `apps/web/src/features/locations/locationTree.ts`
- [x] T035 [US2] Implement location tree browser in `apps/web/src/features/locations/LocationsPage.tsx`
- [x] T036 [US2] Implement location create/edit form in `apps/web/src/features/locations/LocationForm.tsx`
- [x] T037 [US2] Connect item form location selector to location tree in `apps/web/src/features/locations/LocationPicker.tsx`
- [x] T038 [US2] Add location tree smoke test in `apps/web/src/test/location-tree.test.ts`

## Phase 5: User Story 3 - Local search and filters

**Goal**: User can search by name, category, tag, location, due date, and status while offline.

**Independent Test**: Create multiple local items, disable network, search by keyword and filters, and verify only expected household-scoped items are returned.

- [x] T039 [P] [US3] Implement normalized text indexing helpers in `apps/web/src/features/search/searchIndex.ts`
- [x] T040 [US3] Implement local search query service in `apps/web/src/features/search/searchService.ts`
- [x] T041 [US3] Implement search page and filter UI in `apps/web/src/features/search/SearchPage.tsx`
- [x] T042 [US3] Add location/tag/category/status/due-date filter integration in `apps/web/src/features/search/SearchFilters.tsx`
- [x] T043 [US3] Add offline search smoke test in `apps/web/src/test/offline-search.test.ts`

## Phase 6: User Story 4 - Move item and preserve history

**Goal**: User can move an item to another location and see source/destination history.

**Independent Test**: Move an item offline, verify current location changes, history records source and destination, and a pending SyncOp is created.

- [ ] T044 [P] [US4] Implement history repository and action constants in `apps/web/src/db/historyRepository.ts`
- [ ] T045 [US4] Implement item move transaction in `apps/web/src/features/items/moveItem.ts`
- [ ] T046 [US4] Implement item detail screen with current location and history timeline in `apps/web/src/features/items/ItemDetailPage.tsx`
- [ ] T047 [US4] Implement move item UI flow in `apps/web/src/features/items/MoveItemDialog.tsx`
- [ ] T048 [US4] Add move history smoke test in `apps/web/src/test/move-history.test.ts`

## Phase 7: User Story 5 - Offline PWA persistence and installability

**Goal**: User can open the app after first successful load and use local browsing while offline.

**Independent Test**: Load once online, disable network, reload app shell, browse existing local items, and confirm service worker fallback works.

- [ ] T049 [P] [US5] Configure Workbox precache and runtime cache in `apps/web/src/pwa/workbox.ts`
- [ ] T050 [US5] Implement offline fallback page in `apps/web/public/offline.html`
- [ ] T051 [US5] Add app shell cache registration in `apps/web/src/main.tsx`
- [ ] T052 [US5] Implement home dashboard with recent items, reminders, sync count, and current household in `apps/web/src/features/home/HomePage.tsx`
- [ ] T053 [US5] Implement storage estimate and persistent storage request in `apps/web/src/features/settings/StorageSettings.tsx`
- [ ] T054 [US5] Add PWA offline smoke test in `apps/web/src/test/pwa-offline.test.ts`

## Phase 8: User Story 6 - Supabase sync after network restore

**Goal**: Local changes automatically sync to Supabase when network returns, with household-scoped authorization and conflict detection.

**Independent Test**: Create a pending SyncOp offline, restore network, push through Edge Function, mark op synced, then pull household-scoped changes.

- [ ] T055 [P] [US6] Create Supabase migration for households and members in `supabase/migrations/001_households_members.sql`
- [ ] T056 [P] [US6] Create Supabase migration for inventory tables in `supabase/migrations/002_inventory_core.sql`
- [ ] T057 [P] [US6] Create Supabase migration for sync, history, conflicts, and backups in `supabase/migrations/003_sync_history_backup.sql`
- [ ] T058 [US6] Add Supabase RLS policies for household membership isolation in `supabase/migrations/004_rls_policies.sql`
- [ ] T059 [US6] Add private Supabase Storage bucket policy for compressed photos in `supabase/migrations/005_storage_policies.sql`
- [ ] T060 [US6] Implement Edge Function sync push handler in `supabase/functions/sync/push.ts`
- [ ] T061 [US6] Implement Edge Function sync changes handler in `supabase/functions/sync/changes.ts`
- [ ] T062 [US6] Implement client Outbox queue reader and retry/backoff in `apps/web/src/sync/outbox.ts`
- [ ] T063 [US6] Implement client pull cursor handling in `apps/web/src/sync/pull.ts`
- [ ] T064 [US6] Implement conflict queue persistence in `apps/web/src/sync/conflicts.ts`
- [ ] T065 [US6] Implement sync status UI and manual sync button in `apps/web/src/features/settings/SyncSettings.tsx`
- [ ] T066 [US6] Add sync recovery smoke test in `apps/web/src/test/sync-recovery.test.ts`

## Phase 9: User Story 7 - Household membership and least privilege

**Goal**: Admin can manage household members; members can contribute inventory edits but cannot delete data or manage members.

**Independent Test**: Sign in as admin and member, verify admin can invite/remove and delete/restore, while member can create/edit/move but receives authorization errors for delete and member management.

- [ ] T067 [P] [US7] Implement auth session provider in `apps/web/src/services/auth.tsx`
- [ ] T068 [US7] Implement household membership repository in `apps/web/src/db/householdRepository.ts`
- [ ] T069 [US7] Implement household settings page in `apps/web/src/features/households/HouseholdSettingsPage.tsx`
- [ ] T070 [US7] Implement invite and remove member flows in `apps/web/src/features/households/MemberManagement.tsx`
- [ ] T071 [US7] Enforce admin-only delete/restore in `apps/web/src/features/items/deleteRestoreItem.ts`
- [ ] T072 [US7] Add permission-denied UI messages in `apps/web/src/components/PermissionNotice.tsx`
- [ ] T073 [US7] Add household authorization smoke test in `apps/web/src/test/household-authorization.test.ts`

## Phase 10: Photo pipeline and privacy hardening

**Goal**: Photo capture/upload fallback produces only compressed main images and thumbnails without persisted originals or original EXIF metadata.

**Independent Test**: Upload a photo with EXIF metadata, verify canvas re-encoded blobs are persisted, and verify backup/export excludes originals.

- [ ] T074 [P] Implement file upload fallback in `apps/web/src/media/fileInput.ts`
- [ ] T075 [P] Implement camera capture wrapper in `apps/web/src/media/cameraCapture.ts`
- [ ] T076 Implement image decode, resize, and canvas re-encode pipeline in `apps/web/src/media/imageProcessor.ts`
- [ ] T077 Implement thumbnail generation in `apps/web/src/media/thumbnail.ts`
- [ ] T078 Enforce original release and metadata policy in `apps/web/src/media/photoRetentionPolicy.ts`
- [ ] T079 Connect photo capture to add/edit item flow in `apps/web/src/features/items/PhotoInput.tsx`
- [ ] T080 Add photo retention privacy test in `apps/web/src/test/photo-retention.test.ts`

## Phase 11: Soft delete, import/export, backup, and reminders

**Goal**: Users can restore deleted items within 30 days, export/backup household data, restore with schema validation, and view app-internal reminders.

**Independent Test**: Delete and restore within 30 days, simulate cleanup after 30 days, export JSON manifest, dry-run restore, and verify due items appear in reminders.

- [ ] T081 [P] Implement 30-day soft delete retention helpers in `apps/web/src/domain/retention.ts`
- [ ] T082 Implement restore and cleanup workflow in `apps/web/src/features/items/deleteRestoreItem.ts`
- [ ] T083 [P] Implement JSON export manifest writer in `apps/web/src/features/backup/exportManifest.ts`
- [ ] T084 [P] Implement CSV export in `apps/web/src/features/backup/exportCsv.ts`
- [ ] T085 Implement restore dry-run schema validation in `apps/web/src/features/backup/restoreDryRun.ts`
- [ ] T086 Implement backup and restore UI in `apps/web/src/features/settings/BackupSettings.tsx`
- [ ] T087 Implement app-internal reminder list in `apps/web/src/features/reminders/ReminderList.tsx`
- [ ] T088 Add backup manifest and soft delete tests in `apps/web/src/test/backup-retention.test.ts`

## Phase 12: Polish and Cross-Cutting Verification

- [ ] T089 Run TypeScript check and fix issues in `apps/web/tsconfig.json`
- [ ] T090 Run lint and fix issues in `apps/web/eslint.config.js`
- [ ] T091 Run production build and fix issues in `apps/web/package.json`
- [ ] T092 Run unit and smoke tests documented in `apps/web/src/test/`
- [ ] T093 Run Lighthouse PWA audit and record notes in `.specify/features/001-local-first-pwa-inventory/quickstart.md`
- [ ] T094 Verify Chrome/Edge Android behavior and record notes in `.specify/features/001-local-first-pwa-inventory/quickstart.md`
- [ ] T095 Verify Safari iOS/iPadOS camera, storage, and PWA behavior and record notes in `.specify/features/001-local-first-pwa-inventory/quickstart.md`
- [ ] T096 Verify Supabase RLS and Edge Function negative authorization cases against `supabase/migrations/004_rls_policies.sql`
- [ ] T097 Run `git diff --check` before finishing the implementation phase

## Dependencies

- Phase 1 Setup blocks all implementation work.
- Phase 2 Foundational Architecture blocks all user stories.
- US1 depends on Phase 2 and provides the base item creation flow for US3, US4, and US6.
- US2 depends on Phase 2 and should complete before location-dependent parts of US1/US3/US4 are finalized.
- US3 depends on local repositories from US1 and US2.
- US4 depends on item and location repositories from US1 and US2.
- US5 depends on Phase 2 and can proceed in parallel with US1-US4 after routing exists.
- US6 depends on Phase 2 and is most useful after US1 creates SyncOps.
- US7 depends on Supabase schema/RLS from US6 and authorization helpers from Phase 2.
- Photo pipeline hardening can start after Phase 2 but must complete before production validation of US1.
- Soft delete/export/reminders depend on core item, photo, history, and authorization flows.

## Parallel Execution Examples

- T025, T026, and T027 can run in parallel because they touch separate repository files.
- T033 can run while T039 starts search indexing design, but integration waits for location repository completion.
- T055, T056, and T057 can be drafted in parallel before RLS policies in T058.
- T074 and T075 can run in parallel before image processing integration in T076-T079.
- T083 and T084 can run in parallel before restore validation in T085.

## Implementation Strategy

1. Deliver the smallest usable MVP first: Phase 1, Phase 2, US1, US2, US3, and US5.
2. Add movement/history (US4) to satisfy core inventory traceability.
3. Add Supabase sync and household authorization (US6-US7) before claiming cross-device or family sharing support.
4. Complete photo privacy, 30-day soft delete, export/backup, and reminder hardening.
5. Finish with PWA, RLS, Edge Function, and cross-browser verification.
