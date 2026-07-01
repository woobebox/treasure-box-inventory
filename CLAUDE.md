# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root and proxy into `apps/web` (npm workspace):

```bash
npm run dev          # Vite dev server (host 0.0.0.0)
npm run build        # tsc -b && vite build
npm run preview      # serve the production build
npm run lint         # eslint .
npm run typecheck    # tsc -b --pretty false
npm run test         # vitest run (all tests, one-shot)
```

Run a single test file or test by name (from repo root):

```bash
npm --prefix apps/web run test -- src/test/move-history.test.ts
npm --prefix apps/web run test -- -t "conflict"      # filter by test name
npm --prefix apps/web exec vitest                    # watch mode
```

There is no project-level CI script aggregating lint+typecheck+test; run them individually. `docs/github-actions-web-ci.md` describes the CI workflow.

## Spec Kit workflow (read before non-trivial feature work)

This repo is driven by **Spec Kit**. Before starting feature work, `AGENTS.md` requires you to:
1. Read `.specify/memory/active_session.md` (current state, blockers, next action) and the active feature folder under `.specify/features/` (`spec`, `plan.md`, `tasks.md`).
2. Follow the flow **Specify → Plan → Tasks → Implement**. Do not implement a feature without tasks unless the user explicitly requests an emergency fix.
3. Update `active_session.md` before finishing (completed work, verification commands run, blockers, next best action).

`/speckit.*` slash commands are routers: they map to `.github/agents/*.agent.md` workflow files (see the table in `AGENTS.md`). Read the mapped agent file before acting. Reverse-inventory / user-story artifacts go under `specUserStory/`.

The canonical design doc is `.specify/features/001-local-first-pwa-inventory/plan.md`; the original research is `deep-research-report.md`. Much of the plan and in-code user-facing strings/comments are in Traditional Chinese — match that when editing UI copy or error messages.

## Architecture

**Local-first PWA photo inventory.** Single React app in `apps/web`. Every core mutation writes to local IndexedDB first, then reconciles with Supabase asynchronously. The cloud never blocks the local user flow, and the app must stay fully functional offline.

### Data flow: write → outbox → cloud

1. **Repositories** (`src/db/*Repository.ts`) build and validate domain entities and write them to Dexie/IndexedDB inside transactions (`src/db/transactions.ts`).
2. The same operation enqueues a **SyncOp** into the `syncOps` table via `src/sync/syncOpFactory.ts` (status `pending`).
3. **`src/sync/outbox.ts`** (`pushOutbox`) drains pending ops, invokes the Supabase Edge Function `sync/push`, and marks each op `synced` / `conflicted` / `failed` with exponential backoff (`retryDelayMs`).
4. **`src/sync/pull.ts`** pulls remote changes (Edge Function `sync/changes`) using a per-device cursor stored in `deviceSync`. **`src/sync/conflicts.ts`** manages the conflict queue.

The Dexie schema is defined once in `src/db/schema.ts` and wired in `src/db/database.ts` (`InventoryDatabase`, exported singleton `db`). Domain types live in `src/domain/types.ts`; shared helpers (`createId`, `nowIso`, `normalizeText`) in `src/domain/utils.ts`.

### Authorization model

`household_id` is the authorization and sync boundary for all shared data. Two roles only: `admin` and `member`. Client-side checks live in `src/services/authorization.ts` (`requireRole`, `canDeleteOrRestore`) — members can add/edit/move items and locations; only admins manage members and delete/restore data. This is **enforced again server-side**: the `sync/push` Edge Function re-checks active membership and gates `adminOps` (e.g. `item.delete`, `member.remove`, `household.update`), plus Supabase RLS policies. Treat client-side checks as UX, not security.

### Media pipeline (`src/media/`)

Camera/file input → `imageProcessor.ts` decodes, resizes (canvas), and re-encodes to JPEG → `thumbnail.ts` derives a thumbnail. **MVP stores only the compressed main image + thumbnail as Blobs; original files and EXIF metadata are never persisted** (`photoRetentionPolicy.ts` enforces retention). Photos reference items; `coverPhotoId` on an item points at its cover.

### Routing & PWA

There is **no router library**. `src/app/App.tsx` implements navigation by hand via `history.pushState` + a click-capture handler intercepting same-origin `<a>` clicks; `src/app/routes.tsx` declares the route table and bottom-nav entries. PWA setup (service worker registration, Workbox app-shell caching) is in `src/pwa/` and wired from `src/main.tsx`. Auth context is provided by `src/services/auth.tsx` wrapping the app.

### Cloud (`supabase/`)

- `migrations/` — schema, RLS policies (`004_rls_policies.sql`), and storage policies. Mirror any local schema/authorization change here.
- `functions/sync/push.ts` and `changes.ts` — Deno Edge Functions; the server-side authority for sync validation, version checks, and role enforcement.

## Conventions

- **Feature-folder layout**: code is grouped by feature under `src/features/<feature>/` (items, locations, search, households, backup, reminders, settings, tags, categories, home), with cross-cutting concerns in `db/`, `sync/`, `domain/`, `media/`, `services/`, `pwa/`.
- **Tests** (`src/test/*.test.ts`) are scenario-based and exercise the offline-first paths (offline create, offline search, move history, sync recovery, conflict, authorization, retention). They run under jsdom with `fake-indexeddb/auto` (see `src/test/setup.ts`) — no real Supabase. When changing repositories or sync logic, update or add a matching scenario test.
- Repository functions validate drafts before building entities (e.g. `validateItemDraft`) and throw user-facing (Chinese) error messages.
