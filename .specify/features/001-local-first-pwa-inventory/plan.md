# Implementation Plan: Local-first PWA Photo Inventory

- **Feature ID**: `001-local-first-pwa-inventory`
- **Source**: `deep-research-report.md`
- **Date**: 2026-06-22
- **Recommended Stack**: React + TypeScript + Vite + Dexie.js + Workbox + Supabase
- **Planning Status**: Updated after `/speckit.clarify` session on 2026-06-22

## 1. Architecture Decision

採用 local-first PWA 架構。所有核心操作先寫入本地 IndexedDB，再透過 SyncOp/Outbox 與 Supabase 雲端同步。雲端提供認證、家庭群組資料隔離、跨裝置同步、備份與壓縮圖片物件儲存，但不阻塞本地使用者流程。

```text
PWA Frontend
├─ React + TypeScript + Vite
├─ UI Layer
├─ Local Data Layer: IndexedDB / Dexie.js
├─ Media Pipeline: Camera/File → Strip EXIF → Compress → Thumbnail → Blob
├─ Sync Engine: Outbox / Inbox / Conflict Queue
├─ PWA Layer: Manifest / Service Worker / Cache Storage
└─ Cloud Adapter: Supabase Auth / Postgres + RLS / Storage / Edge Functions
```

### 1.1 Clarified MVP Decisions

- MVP 支援家庭群組，不支援多人即時協作。
- 所有共享資料以 `household_id` 作為主要授權與同步邊界。
- 權限模型固定為兩種角色：`admin` 與 `member`。
- 管理者可邀請、移除與管理家庭成員，並可刪除與還原資料。
- 成員可新增、編輯與移動物品和位置，但不可管理成員或刪除資料。
- MVP 照片只保存壓縮主圖與縮圖；原圖與原始 EXIF metadata 不寫入 IndexedDB、備份或雲端儲存。
- MVP 雲端後端確定使用 Supabase Auth、Postgres/RLS、Storage 與 Edge Functions。
- Soft delete 固定保留 30 天，超過後可由清理流程永久刪除。
- 第一版可靠推播仍不納入 MVP；以 App 內提醒與待處理列表為主。

## 2. Technology Choices

| Area | Technology | Reason |
|---|---|---|
| Frontend | React + TypeScript | 成熟、型別安全、適合資料密集 UI |
| Build | Vite | 快速開發與簡單 PWA 整合 |
| Local DB | IndexedDB + Dexie.js | 支援結構化本地資料、索引與 Blob metadata |
| PWA | Workbox + Web App Manifest | 管理 App Shell、runtime cache 與離線啟動 |
| Styling | Tailwind CSS / shadcn/ui | 快速建立手機優先 UI |
| Auth | Supabase Auth | 可配合 Postgres/RLS 與家庭成員身分 |
| Cloud DB | Supabase PostgreSQL | 適合關聯資料、位置樹、標籤、歷史、家庭群組與同步游標 |
| Authorization | Supabase RLS | 以 `household_id` 與 household membership 做資料列層級隔離 |
| Object Storage | Supabase Storage | 只儲存壓縮主圖、縮圖與備份 ZIP |
| Server Logic | Supabase Edge Functions | 集中執行 SyncOp 驗證、版本檢查與成員權限檢查 |
| Sync | Custom SyncOp protocol | 控制離線、重試、衝突與資料版本 |

## 3. Data Model

### 3.1 Core Entities

- `households`
- `household_members`
- `items`
- `photos`
- `locations`
- `tags`
- `item_tags`
- `history`
- `device_sync`
- `sync_ops`
- `conflicts`
- `backup_snapshots`
- `settings`

### 3.2 Future Entities

- `share_grants`
- `notification_subscriptions`
- `ocr_jobs`
- `ai_classification_suggestions`

### 3.3 Core Fields

```text
households:
- id uuid primary key
- name text
- created_by uuid
- created_at timestamptz
- updated_at timestamptz
- deleted_at timestamptz nullable

household_members:
- id uuid primary key
- household_id uuid
- user_id uuid
- role text check in ('admin', 'member')
- status text check in ('invited', 'active', 'removed')
- invited_by uuid nullable
- invited_at timestamptz nullable
- joined_at timestamptz nullable
- removed_at timestamptz nullable
- created_at timestamptz
- updated_at timestamptz

items:
- id uuid primary key
- household_id uuid
- created_by uuid
- updated_by uuid
- current_location_id uuid
- cover_photo_id uuid nullable
- name text
- normalized_name text
- category text
- status text
- notes text
- due_at timestamptz nullable
- version integer
- created_at timestamptz
- updated_at timestamptz
- deleted_at timestamptz nullable

locations:
- id uuid primary key
- household_id uuid
- parent_id uuid nullable
- type text
- name text
- path text
- sort_order integer
- version integer
- created_at timestamptz
- updated_at timestamptz
- deleted_at timestamptz nullable

photos:
- id uuid primary key
- household_id uuid
- item_id uuid
- storage_key text
- thumb_key text
- local_main_blob_key text nullable
- local_thumb_blob_key text nullable
- width integer
- height integer
- mime_type text
- byte_size integer
- thumb_byte_size integer
- exif_stripped boolean default true
- original_retained boolean default false
- taken_at timestamptz nullable
- created_at timestamptz
- deleted_at timestamptz nullable

history:
- id uuid primary key
- household_id uuid
- item_id uuid nullable
- actor_id uuid
- action text
- from_location_id uuid nullable
- to_location_id uuid nullable
- changed_fields jsonb
- device_id text
- occurred_at timestamptz

sync_ops:
- id uuid primary key
- household_id uuid
- actor_id uuid
- device_id text
- op_type text
- entity_type text
- entity_id uuid
- base_version integer nullable
- payload jsonb
- status text check in ('pending', 'pushing', 'synced', 'failed', 'conflicted')
- retry_count integer
- last_error text nullable
- created_at timestamptz
- updated_at timestamptz
- synced_at timestamptz nullable

device_sync:
- id uuid primary key
- household_id uuid
- user_id uuid
- device_id text
- last_pulled_cursor text nullable
- last_pushed_at timestamptz nullable
- created_at timestamptz
- updated_at timestamptz
```

### 3.4 State and Retention Rules

- `household_members.role = admin` may manage members and perform delete/restore operations.
- `household_members.role = member` may create/edit/move items and locations but may not manage members or delete data.
- Soft-deleted entities remain restorable for 30 days after `deleted_at`.
- Cleanup jobs may permanently delete soft-deleted rows and associated compressed images after 30 days.
- Photo records must keep `original_retained = false` for MVP.
- Photo import/export must preserve compressed main image and thumbnail only.

## 4. Sync Design

### 4.1 Write Path

```text
User Action
→ Validate input and role permissions locally
→ Write domain change to IndexedDB transaction
→ Append household-scoped SyncOp to Outbox
→ Update UI immediately
→ Try push if online
```

### 4.2 Push Path

```text
Read pending SyncOps
→ POST Supabase Edge Function /sync/push
→ Edge Function verifies Supabase Auth JWT
→ Edge Function validates household membership and role permission
→ Edge Function validates base_version and entity household_id
→ Server writes rows and history under Postgres transaction
→ Server returns ack + server version + change cursor
→ Local marks SyncOp synced
```

### 4.3 Pull Path

```text
Read device_sync.last_pulled_cursor per household/device
→ GET Supabase Edge Function /sync/changes?household_id=...&cursor=...
→ Edge Function verifies membership and returns household-scoped changes
→ Apply remote changes locally
→ Advance cursor
```

### 4.4 Conflict Strategy

MVP 採分層策略：

1. 非高風險欄位：last-write-wins。
2. `name`、`notes`、`current_location_id`、`role`、`deleted_at`：使用 version 與權限檢查偵測。
3. 版本不符時放入 conflict queue，SyncOp 狀態改為 `conflicted`。
4. UI 顯示保留本機、保留雲端、手動合併。
5. 成員管理與刪除衝突必須由管理者解決。

## 5. PWA and Offline Strategy

### 5.1 Precache

- HTML shell
- JS/CSS bundles
- Manifest
- Icons
- Offline fallback page

### 5.2 Runtime Cache

- Thumbnail responses
- Static assets
- Recently viewed compressed item images

### 5.3 IndexedDB Stores

- `households`
- `householdMembers`
- `items`
- `photos`
- `locations`
- `tags`
- `itemTags`
- `history`
- `syncOps`
- `deviceSync`
- `conflicts`
- `settings`

### 5.4 Storage Management

- Call `navigator.storage.persist()` after onboarding or first large import.
- Show storage estimate and compressed photo usage.
- Allow clearing runtime image cache while preserving IndexedDB metadata and required compressed local images.
- Do not store original photos in IndexedDB, Cache Storage, backups, or Supabase Storage.

## 6. Media Pipeline

```text
Camera getUserMedia OR file input
→ Decode with createImageBitmap when available
→ Draw to canvas
→ Strip/avoid original EXIF metadata
→ Generate compressed main image Blob
→ Generate thumbnail Blob
→ Store compressed metadata and Blob references
→ Upload compressed main image and thumbnail to Supabase Storage when synced
→ Release original File/Blob references
```

Fallbacks:

- If camera permission denied, use file input.
- If target image format unsupported, fallback to browser-supported Blob type.
- If upload fails, keep compressed local Blob and retry.
- If EXIF stripping cannot be verified, route through canvas re-encode before persistence.

## 7. User Interface Structure

```text
Bottom Navigation:
首頁 | 位置 | 新增 | 搜尋 | 設定

首頁:
- 今日提醒
- 最近新增
- 待同步數量
- 快速新增
- 目前家庭群組

位置:
- 位置樹
- 位置內物品列表

新增:
- 拍照 / 上傳
- 名稱
- 分類
- 標籤
- 位置

搜尋:
- 關鍵字
- 分類
- 標籤
- 位置
- 到期日
- 狀態

設定:
- 家庭群組與成員
- 同步狀態
- 匯入匯出
- 備份還原
- 儲存空間
```

### 7.1 Permission UX

- 管理者可看到邀請/移除成員、刪除與還原入口。
- 成員不可看到或不可執行成員管理與刪除入口；若離線狀態下角色未知或過期，需顯示保守拒絕或待同步確認。
- 所有權限錯誤需顯示可理解訊息，例如「你沒有刪除此物品的權限」。

## 8. Security Plan

- Require HTTPS for production.
- Use Supabase Auth for identity.
- Use Postgres RLS to scope rows by `household_id` and active membership.
- RLS policies must default-deny cross-household access and must not rely on frontend-only authorization.
- Edge Functions must re-check membership role for SyncOp push, delete/restore, member management, and storage object operations.
- Use private Supabase Storage buckets with signed URLs or authenticated download policies.
- Storage object keys must include `household_id` and must be validated against database rows before access.
- Avoid storing sensitive tokens in localStorage; prefer Supabase client session handling with secure refresh behavior.
- Strip EXIF metadata and never persist original photos in MVP.
- Enforce 30-day soft-delete retention unless explicit backup/export requires user-controlled retention.
- Optional future feature: Web Crypto encryption for selected sensitive notes or photos.

## 9. Deployment Plan

Recommended hosting:

- Vercel, Netlify, or Cloudflare Pages for PWA frontend.
- Supabase for Auth/Postgres/Storage/Edge Functions.

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- future sync endpoint variables if Edge Functions are split from Supabase defaults.

Operational notes:

- Supabase migrations must create RLS policies before production data import.
- Storage buckets for item photos must be private by default.
- Edge Function secrets must be stored in Supabase secrets or CI/CD protected variables, never hard-coded.

## 10. Verification Plan

### Static and Build

- TypeScript check.
- Lint.
- Production build.
- `git diff --check` for whitespace.

### Functional

- Create item offline.
- Search item offline.
- Move item and verify history.
- Restore app and verify IndexedDB persistence.
- Camera denied fallback to file upload.
- Verify original photo and EXIF metadata are not persisted after processing.
- Verify soft-deleted items can be restored within 30 days.
- Verify cleanup can permanently delete soft-deleted rows after 30 days.

### Authorization and Security

- Verify household member cannot read another household's rows through Supabase queries.
- Verify member can create/edit/move but cannot delete or manage members.
- Verify admin can invite/remove members and delete/restore data.
- Verify RLS rejects cross-`household_id` direct table access.
- Verify Edge Function rejects SyncOps whose `household_id` does not match active membership.

### PWA

- Manifest valid.
- Service worker registers.
- App Shell opens offline after first load.
- Lighthouse PWA audit.

### Sync

- Pending SyncOp remains after network failure.
- SyncOp becomes synced after network restore.
- Conflict is detected when versions mismatch.
- Household-scoped pull only returns allowed changes.
- Delete/restore conflicts require admin resolution.

## 11. Milestones

| Phase | Deliverable |
|---|---|
| 0 | Spec, clarification, plan, tasks |
| 1 | PWA shell, routing, project structure |
| 2 | Local IndexedDB data model with household/member scope |
| 3 | Household-aware item/location/tag CRUD |
| 4 | Photo capture/upload pipeline with compression-only retention |
| 5 | Search, location tree, history, soft delete/restore |
| 6 | Supabase schema, Auth, RLS, private Storage |
| 7 | Edge Function sync engine and conflict queue |
| 8 | Export/import, backup/restore, app-internal reminders |
| 9 | Authorization, PWA, cross-browser and production hardening |

## 12. Source Layout Decision

This repository will contain the PWA source directly under `apps/web` and Supabase backend artifacts under `supabase`. Planned paths:

```text
apps/web/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ db/
│  ├─ features/
│  ├─ media/
│  ├─ pwa/
│  ├─ services/
│  ├─ sync/
│  └─ test/
├─ public/
└─ package.json

supabase/
├─ migrations/
└─ functions/
   └─ sync/
```

Root `package.json` should delegate common scripts to `apps/web` so repository-level `npm run build`, `npm run lint`, `npm run typecheck`, and `npm run test` remain stable validation entry points.
