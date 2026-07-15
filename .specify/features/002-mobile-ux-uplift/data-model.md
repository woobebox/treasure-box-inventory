# Data Model: 手機 UX 優化第一批

**Feature**: `002-mobile-ux-uplift` | **Date**: 2026-07-14

## 結論：無新持久化實體、無 schema 變更

本批四項功能全部建立在既有資料模型之上：

- **Dexie（本地）**：不新增資料表、不 bump `database.ts` 版本。自動同步讀寫的是既有 `syncOps` 表（`status`、`retryCount`、`lastError`）與 `deviceSync`（pull cursor），皆為既有欄位與語意。
- **Supabase（雲端）**：不改 migrations、RLS、Edge Functions。
- **位置詳情頁**：純讀取既有 `locations` / `items`；「在此位置新增物品」走既有 `createItem` 流程。

## 執行期（非持久化）狀態

### SyncSchedulerState（`src/sync/syncScheduler.ts`，模組單例）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `enabled` | `boolean` | Supabase 已設定且已選定家庭時為 true；false 時所有觸發器不註冊 |
| `pendingCount` | `number` | `syncOps` 中 `status !== 'synced'` 的筆數；同步後重算、本地寫入時樂觀 +1 |
| `phase` | `'idle' \| 'syncing' \| 'success' \| 'error'` | 最近一次同步流程的狀態；防重入以 in-flight Promise 判斷 |
| `message` | `string` | 使用者可讀的最近結果摘要（繁中） |
| `reasons` | `string[]` | 最近一次推送的伺服器拒絕原因去重清單（沿用 `PushResult.reasons`） |

狀態轉移：`idle → syncing →（success | error）→ syncing → …`；`stop()`/`configure()` 重設為初始。

### 路由層新增狀態（`App.tsx` 內部）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `inAppNavCount` | `ref<number>` | 站內 `navigate()` 次數計數；popstate 時遞減、不低於 0；決定返回鍵走 `history.back()` 或 fallback |

### 頁面初始參數（URL query，非狀態機一部分）

| 參數 | 使用頁 | 說明 |
|------|--------|------|
| `locationId` | `/add` | 由位置詳情頁帶入的預選位置；頁面 mount 時讀取一次，位置不存在或已刪除時忽略 |
