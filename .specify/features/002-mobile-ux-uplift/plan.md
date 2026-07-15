# Implementation Plan: 手機 UX 優化第一批（自動同步、即時導覽、位置瀏覽、返回鍵）

**Branch**: `002-mobile-ux-uplift` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.specify/features/002-mobile-ux-uplift/spec.md`

## Summary

補完既有體驗承諾的四項手機 UX 優化：(1) 以模組級同步排程器（Dexie syncOps 表 hook + 去抖動推送 + 啟動/回前景/上線自動拉取 + 防重入）取代「只能在設定頁手動同步」；(2) 移除 `App.tsx` 路由的 220ms 人為骨架延遲，改為即時切換；(3) 新增位置詳情頁 `/locations/:id`，複用 `collectDescendantLocationIds` 與 `ItemCard` 呈現該位置（含子位置）物品，並提供「在此位置新增物品」（query 預選）與內嵌編輯；(4) 非頂層路由 header 加返回鍵（站內導覽計數判斷 back 或 fallback 上層頁）。技術決策詳見 [research.md](./research.md)。

## Technical Context

**Language/Version**: TypeScript（npm `latest`，經 lockfile 固定）+ React（function components + hooks）

**Primary Dependencies**: Vite、Dexie（IndexedDB）、@supabase/supabase-js（Edge Functions invoke）、Tailwind CSS、lucide-react、vite-plugin-pwa/workbox

**Storage**: 本地 IndexedDB（Dexie，schema 不變、無版本升級）；雲端 Supabase Postgres（本批不改 schema、不改 Edge Functions）

**Testing**: vitest + jsdom + fake-indexeddb/auto + @testing-library/react（場景測試，`src/test/*.test.ts(x)`）

**Target Platform**: 行動瀏覽器優先的 PWA（iOS Safari standalone、Android Chrome），GitHub Pages 部署（base path `/treasure-box-inventory/`）

**Project Type**: 單一 Web 前端（`apps/web`，npm workspace）

**Performance Goals**: 頁面切換無人為延遲（體感即時）；自動同步去抖動 2.5s、回前景節流 30s，避免重複請求

**Constraints**: 離線優先——雲端不可用時零阻塞、零干擾錯誤；`household_id` 為資料與同步邊界；UI 文案繁體中文

**Scale/Scope**: 4 個使用者故事；預估觸及 `src/sync/`（新增 scheduler）、`src/app/App.tsx`、`src/features/locations/`（新頁 + 節點改版）、`src/features/items/AddItemPage.tsx`、`src/features/home/HomePage.tsx`、`src/features/settings/SyncSettings.tsx`

## Constitution Check

*GATE: `.specify/memory/constitution.md` 仍為未填寫的模板，無正式條文；以 repo 既有慣例（CLAUDE.md / AGENTS.md）作為等效關卡：*

- ✅ **離線優先**：所有本批功能離線可用；自動同步失敗不阻塞本地流程（FR-005/FR-008）。scheduler 在無 Supabase 時完全停用。
- ✅ **寫入路徑不變**：不改 repository → syncOps → outbox 的資料流；scheduler 只是觸發器，不新增寫入路徑、不改衝突策略。
- ✅ **授權邊界不變**：無新增 admin 操作；位置詳情頁為讀取 + 既有編輯能力複用；不改 Edge Functions 與 RLS。
- ✅ **場景測試**：同步邏輯變更配套 scheduler 場景測試；UI 動線配套位置詳情 / 預選 / 返回鍵測試（見 research R10）。
- ✅ **繁體中文文案**：所有新 UI 字串繁中。

**Post-design re-check**: 通過——設計未引入新依賴、新資料表、新雲端介面。

## Project Structure

### Documentation (this feature)

```text
.specify/features/002-mobile-ux-uplift/
├── spec.md              # 功能規格（已完成）
├── plan.md              # 本檔
├── research.md          # Phase 0 技術決策
├── data-model.md        # Phase 1 資料模型（無新實體，見檔內說明）
├── quickstart.md        # Phase 1 驗證指南
├── checklists/
│   └── requirements.md  # 規格品質檢查（全數通過）
└── tasks.md             # Phase 2（/speckit.tasks 產出）
```

（無 `contracts/`：本批不新增或變更任何對外介面——Edge Functions、DB schema、備份格式皆不動。）

### Source Code (repository root)

```text
apps/web/src/
├── app/
│   └── App.tsx                        # [改] 移除人為延遲；返回鍵；/locations/:id 路由；navigate 攜帶 search
├── sync/
│   ├── syncScheduler.ts               # [新] 自動同步排程器（單例 + subscribe + 注入式 push/pull）
│   ├── useSyncStatus.ts               # [新] useSyncExternalStore 包裝 + useAutoSync 生命週期 hook
│   ├── outbox.ts                      # [不改] pushOutbox 介面沿用
│   └── pull.ts                        # [不改] pullChanges 介面沿用
├── features/
│   ├── home/HomePage.tsx              # [改] 待同步計數 → 可點擊同步狀態指示
│   ├── settings/SyncSettings.tsx      # [改] 立即同步改走 scheduler.requestSync()
│   ├── locations/
│   │   ├── LocationsPage.tsx          # [改] 節點：點名稱進詳情、新增明確編輯鈕
│   │   ├── LocationDetailPage.tsx     # [新] 位置詳情：資訊 + 子樹物品清單 + 新增/編輯入口
│   │   └── locationTree.ts            # [不改] 複用 collectDescendantLocationIds
│   └── items/AddItemPage.tsx          # [改] 讀取 ?locationId= 預選位置
└── test/
    ├── sync-scheduler.test.ts         # [新] 去抖動/防重入/節流/disabled/stop
    ├── location-detail.test.tsx       # [新] 子樹物品、空狀態、預選新增連結
    └── app-back-navigation.test.tsx   # [新] 返回鍵顯示與 fallback（並更新既有骨架斷言的測試）
```

**Structure Decision**: 沿用 feature-folder 慣例；同步排程器屬跨功能基礎設施，放 `src/sync/`；無新資料層或雲端變更。

## 實作設計要點（依 User Story）

### US1 自動同步（P1）

1. `syncScheduler.ts`：`configure({ householdId, deviceId, enabled, pushFn?, pullFn? })`、`stop()`、`requestSync(reason)`、`notifyLocalWrite()`、`getState()`、`subscribe(listener)`。狀態：`{ enabled, pendingCount, phase: 'idle'|'syncing'|'success'|'error', message, reasons }`。
2. 觸發器（僅 enabled 時註冊）：
   - Dexie `db.syncOps.hook('creating')` → `notifyLocalWrite()` → 2.5s 去抖動 → `requestSync('local-write')`。
   - `configure` 完成 → 立即 `requestSync('startup')`。
   - `visibilitychange`（→visible）與 `online` → `requestSync('foreground'|'online')`，30s 節流（startup 不受限）。
3. 防重入：in-flight Promise 單例；進行中忽略新請求。每次同步後重算 `pendingCount`（查 `status !== 'synced'`），並於 `notifyLocalWrite` 樂觀 +1。
4. `useAutoSync()`（AppShell 掛載）：effect 依賴 `[householdId, deviceId]`；`supabase` null 或無 householdId → `configure({ enabled: false })`；cleanup → `stop()`（清 debounce/節流計時器、解除 window 事件與 Dexie hook）。
5. `HomePage`：同步指示元件（膠囊）顯示 pendingCount + phase 圖示；點擊 → `requestSync('manual')`；純離線模式顯示「純離線模式」不可點。
6. `SyncSettings`：按鈕改走 `requestSync('manual')`，顯示 scheduler 狀態與 `reasons` 明細；保留家庭/裝置資訊列。

### US2 位置詳情（P2）

1. `LocationDetailPage({ locationId })`：載入 `listLocationsByHousehold` + `listItemsByHousehold`；`collectDescendantLocationIds` 過濾子樹物品（排除 `status === 'deleted'`）；直屬物品在前、子位置物品在後（各依 `updatedAt` 新→舊）。
2. 標頭區：名稱、`formatLocationType`、完整 `path`、物品數；動作列：「在此位置新增物品」（`<a href="/add?locationId=...">`）、「編輯位置」（toggle 內嵌 `LocationForm` editing 模式，onSaved 重載）。
3. 空狀態：「這個位置還沒有物品」+ 新增入口；位置不存在：「找不到位置」+ 回位置頁連結。
4. `LocationsPage` Node：名稱改為 `<a>` 連到詳情頁；新增鉛筆編輯鈕（觸控目標 ≥ 40px）呼叫原 `onEdit`。
5. `App.tsx` 路由：`path === '/locations'` → 列表；`path.startsWith('/locations/')` → 詳情（decodeURIComponent id）；`pageCopy` 加位置詳情標題。

### US3 即時導覽（P3）

1. `completeNavigation`：移除 `setTimeout(220)` 與 `isRouteLoading`；直接 `setPath` + `window.scrollTo({ top: 0 })`。
2. 刪除 `RouteSkeleton` 與相關 CSS（`skeleton-block` 若無他處使用）；保留 `page-content-enter` 淡入。
3. `handleInternalLink` / `navigate`：pushState URL 帶上 `url.search`（邏輯 path 狀態仍只存 pathname）。
4. 更新任何斷言「頁面載入中」骨架的既有測試。

### US4 返回鍵（P4）

1. `AppShell`：`inAppNavCount` ref，`navigate()` 時 +1、popstate 時 -1（不低於 0）。
2. header：`path` 不屬於底部導覽五頁時顯示 `←` 鈕（`aria-label="返回"`，觸控目標 ≥ 44px）；點擊 → count > 0 ? `history.back()` : `navigate(fallback)`；fallback：`/items/*`→`/`、`/locations/*`→`/locations`、`/trash`→`/settings`、其他→`/`。
3. `AddItemPage` 預選：mount 時讀 `new URLSearchParams(window.location.search).get('locationId')`，存在且位置有效時設為表單初始位置。

## Complexity Tracking

無憲章違規；無需記錄。
