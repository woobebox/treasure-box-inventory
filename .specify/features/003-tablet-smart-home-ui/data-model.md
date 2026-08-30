# Data Model: 平板智慧家居儀表板 UI／UX

**Feature**: `003-tablet-smart-home-ui` | **Date**: 2026-08-19

## 持久化資料

本功能不新增資料表、不新增欄位、不 bump IndexedDB schema，也不修改 Supabase migration、RLS 或 Edge Function。

首頁讀取既有資料：

- `items`：`listItemsByHousehold(householdId)` 的未刪除物品集合。
- `locations`：`listLocationsByHousehold(householdId)` 的未刪除位置集合。
- `syncOps`：由既有 `useSyncStatus()` 暴露的執行期待同步數與 phase。

## 前端執行期介面

### `ButtonProps`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `variant` | `primary \| secondary \| ghost \| danger` | 操作層級 |
| `size` | `md \| lg` | 控制高度與內距 |
| `busy` | `boolean` | 顯示載入文字／狀態並停用重複操作 |
| `fullWidth` | `boolean` | 是否填滿父容器 |
| `leadingIcon` | `ReactNode` | 可選 Lucide 圖示 |

### `ActionLinkProps`

保留原生 `href` 與 anchor 鍵盤語意，接受與 `ButtonProps` 相同的視覺層級與尺寸。

### `IconButtonProps`

`aria-label` 為必要欄位，hit area 至少 48px；圖示只負責視覺，不能取代可讀名稱。

### `ActionTileProps`

包含既有路由 `href`、Lucide icon、標題、說明與 semantic tone；整張 tile 為單一 anchor 操作。

### `HomeDashboardData`

| 欄位 | 型別 | 來源 |
|---|---|---|
| `itemCount` | `number` | 未刪除物品數 |
| `locationCount` | `number` | 未刪除位置數 |
| `pendingSyncCount` | `number` | `useSyncStatus().pendingCount` |
| `recentItems` | `RecentItem[]` | 既有首頁最近物品組裝結果 |

上述型別為記憶體資料，不寫入 IndexedDB 或雲端。
