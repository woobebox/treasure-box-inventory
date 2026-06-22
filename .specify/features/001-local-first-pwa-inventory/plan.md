# Implementation Plan: Local-first PWA Photo Inventory

- **Feature ID**: `001-local-first-pwa-inventory`
- **Source**: `deep-research-report.md`
- **Date**: 2026-06-22
- **Recommended Stack**: React + TypeScript + Vite + Dexie.js + Workbox + Supabase

## 1. Architecture Decision

採用 local-first PWA 架構。所有核心操作先寫入本地 IndexedDB，再透過 SyncOp/Outbox 與雲端同步。雲端提供認證、跨裝置同步、備份與圖片物件儲存，但不阻塞本地使用者流程。

```text
PWA Frontend
├─ React + TypeScript + Vite
├─ UI Layer
├─ Local Data Layer: IndexedDB / Dexie.js
├─ Media Pipeline: Camera/File → Compress → Thumbnail → Blob
├─ Sync Engine: Outbox / Inbox / Conflict Queue
├─ PWA Layer: Manifest / Service Worker / Cache Storage
└─ Cloud Adapter: Supabase Auth / Postgres / Storage / Edge Functions
```

## 2. Technology Choices

| Area | Technology | Reason |
|---|---|---|
| Frontend | React + TypeScript | 成熟、型別安全、適合資料密集 UI |
| Build | Vite | 快速開發與簡單 PWA 整合 |
| Local DB | IndexedDB + Dexie.js | 支援結構化本地資料、索引與 Blob metadata |
| PWA | Workbox + Web App Manifest | 管理 App Shell、runtime cache 與離線啟動 |
| Styling | Tailwind CSS / shadcn/ui | 快速建立手機優先 UI |
| Auth | Supabase Auth | 可配合 Postgres/RLS |
| Cloud DB | Supabase PostgreSQL | 適合關聯資料、位置樹、標籤、歷史與分享模型 |
| Authorization | Supabase RLS | 以資料列層級隔離使用者與家庭資料 |
| Object Storage | Supabase Storage | 儲存主圖、縮圖與備份 ZIP |
| Sync | Custom SyncOp protocol | 控制離線、重試、衝突與資料版本 |

## 3. Data Model

### 3.1 Core Entities

- `items`
- `photos`
- `locations`
- `tags`
- `item_tags`
- `history`
- `device_sync`
- `sync_ops`
- `backup_snapshots`

### 3.2 Future Entities

- `households`
- `household_members`
- `share_grants`

### 3.3 Core Fields

```text
items:
- id uuid primary key
- owner_id uuid
- current_location_id uuid
- cover_photo_id uuid
- name text
- normalized_name text
- category text
- status text
- notes text
- due_at timestamptz
- version integer
- created_at timestamptz
- updated_at timestamptz
- deleted_at timestamptz

locations:
- id uuid primary key
- owner_id uuid
- parent_id uuid nullable
- type text
- name text
- path text
- sort_order integer
- created_at timestamptz
- updated_at timestamptz

photos:
- id uuid primary key
- item_id uuid
- storage_key text
- thumb_key text
- local_blob_key text
- width integer
- height integer
- mime_type text
- byte_size integer
- taken_at timestamptz
- created_at timestamptz

history:
- id uuid primary key
- item_id uuid
- actor_id uuid
- action text
- from_location_id uuid nullable
- to_location_id uuid nullable
- changed_fields jsonb
- device_id text
- occurred_at timestamptz
```

## 4. Sync Design

### 4.1 Write Path

```text
User Action
→ Validate input
→ Write to IndexedDB transaction
→ Append SyncOp to Outbox
→ Update UI immediately
→ Try push if online
```

### 4.2 Push Path

```text
Read pending SyncOps
→ POST /sync/push or Supabase Edge Function
→ Server validates base_version
→ Server writes rows and history
→ Server returns ack + server version
→ Local marks SyncOp synced
```

### 4.3 Pull Path

```text
Read device_sync.last_pulled_cursor
→ GET /sync/changes?cursor=...
→ Apply remote changes locally
→ Advance cursor
```

### 4.4 Conflict Strategy

MVP 採分層策略：

1. 非高風險欄位：last-write-wins。
2. `name`、`notes`、`current_location_id`：使用 version 偵測。
3. 版本不符時放入 conflict queue。
4. UI 顯示保留本機、保留雲端、手動合併。

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
- Recently viewed item images

### 5.3 IndexedDB Stores

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
- Show storage estimate.
- Allow clearing local image cache while preserving metadata.

## 6. Media Pipeline

```text
Camera getUserMedia OR file input
→ Decode with createImageBitmap when available
→ Draw to canvas
→ Generate main image Blob
→ Generate thumbnail Blob
→ Store local metadata and Blob reference
→ Upload to cloud storage when synced
```

Fallbacks:

- If camera permission denied, use file input.
- If target image format unsupported, fallback to browser-supported Blob type.
- If upload fails, keep local Blob and retry.

## 7. User Interface Structure

```text
Bottom Navigation:
首頁 | 位置 | 新增 | 搜尋 | 設定

首頁:
- 今日提醒
- 最近新增
- 待同步數量
- 快速新增

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
- 同步狀態
- 匯入匯出
- 備份還原
- 儲存空間
```

## 8. Security Plan

- Require HTTPS for production.
- Use Supabase Auth for identity.
- Use RLS to scope rows by `owner_id` or household membership.
- Use private storage buckets with signed URLs where needed.
- Avoid storing sensitive tokens in localStorage.
- Optional future feature: Web Crypto encryption for selected sensitive notes or photos.

## 9. Deployment Plan

Recommended hosting:

- Vercel, Netlify, or Cloudflare Pages for PWA frontend.
- Supabase for Auth/Postgres/Storage/Edge Functions.

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- future sync endpoint variables if Edge Functions are used.

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

### PWA

- Manifest valid.
- Service worker registers.
- App Shell opens offline after first load.
- Lighthouse PWA audit.

### Sync

- Pending SyncOp remains after network failure.
- SyncOp becomes synced after network restore.
- Conflict is detected when versions mismatch.

## 11. Milestones

| Phase | Deliverable |
|---|---|
| 0 | Spec, plan, tasks |
| 1 | PWA shell and routing |
| 2 | Local IndexedDB data model and CRUD |
| 3 | Photo capture/upload pipeline |
| 4 | Search, location tree, history |
| 5 | Supabase schema, auth, storage |
| 6 | Sync engine and conflict queue |
| 7 | Export/import, backup/restore, reminders |
| 8 | Cross-browser PWA validation and production hardening |
