# Research: 手機 UX 優化第一批

**Feature**: `002-mobile-ux-uplift` | **Date**: 2026-07-14

本功能不引入新技術棧；研究聚焦在四個範圍項目在既有架構（React 手寫路由 + Dexie + Supabase Edge Functions）內的落點選擇。

## R1. 自動同步排程器的架構位置

- **Decision**: 新增 `src/sync/syncScheduler.ts` 模組級單例（非 React 元件），持有 `{ pendingCount, phase, lastMessage, reasons }` 狀態與 subscribe 機制；React 端以 `useSyncExternalStore` 包成 `useSyncStatus()` hook。`AppShell` 掛載一個 `useAutoSync()` hook 負責 configure（householdId/deviceId/enabled）與生命週期繫結。
- **Rationale**: 同步狀態需要跨頁共享（首頁指示、設定頁按鈕），且觸發來源多半不在 React 樹內（Dexie hook、window 事件）。模組單例 + external store 最小、可測試（可注入 push/pull 函式與時間），避免多一層 Context re-render。
- **Alternatives considered**: ① React Context Provider — 觸發來源在 React 外，仍需外部橋接，多餘；② `dexie-observable`/`liveQuery` — 需要加依賴或改用 `dexie-react-hooks`，超出本批必要範圍。

## R2. 「本地寫入後自動推送」的偵測點

- **Decision**: 在 scheduler 啟用時註冊 Dexie 表層 hook `db.syncOps.hook('creating')` 作為唯一 choke point；hook 觸發時呼叫 `scheduler.notifyLocalWrite()` 排入去抖動推送。停用時解除 hook。
- **Rationale**: 所有 repository 的變更操作（item/location/photo/tag…）最終都會在交易內寫入 `syncOps` 表，掛在表上即可涵蓋現在與未來所有寫入點，不需逐一改動十餘個 call-site。hook 在交易內同步觸發，但實際推送發生在 2.5 秒後、由 `pushOutbox` 重新讀 DB，因此不受交易未 commit 的影響。
- **Alternatives considered**: ① 在每個 mutation call-site 手動呼叫 scheduler — 易遺漏、維護成本高；② 定時輪詢 pending 數 — 耗電且延遲不可控。

## R3. 去抖動與節流參數

- **Decision**: 寫入後推送去抖動 **2.5 秒**（連續多筆寫入合併為一次推送）；回前景（`visibilitychange` → visible）與 `online` 事件觸發完整同步（push+pull），以 **30 秒**最小間隔節流；App 啟動（scheduler configure 完成）立即執行一次完整同步，不受節流限制。
- **Rationale**: 符合 spec Assumptions（2–3 秒 / 30 秒等級）；數值集中為 scheduler 常數，可測試（fake timers）也可日後調整。
- **Alternatives considered**: Background Sync API — iOS Safari 不支援，不符合 PWA 目標平台。

## R4. 防重入與手動同步整合

- **Decision**: scheduler 內部維持單一 in-flight Promise；`requestSync()` 在同步進行中時直接忽略新請求（回傳進行中的結果）。`SyncSettings` 的「立即同步」與首頁指示點擊都改走 `requestSync()`，共用同一保護與狀態。
- **Rationale**: FR-007 要求手動與自動共用防重入；單一入口也讓 UI 狀態（syncing/success/error）只有一個事實來源。
- **Alternatives considered**: 佇列化重複請求 — 對本場景無增益（下一次觸發事件遲早會來）。

## R5. 純離線模式與登出／切換家庭

- **Decision**: `supabase` 為 null 或尚無 householdId 時 scheduler 為 `disabled`：不註冊任何事件、不掛 Dexie hook、UI 指示顯示純離線文案。`useAutoSync` 的 effect 以 `[householdId, deviceId]` 為依賴，cleanup 時 `scheduler.stop()`（清計時器、解除事件與 hook），換家庭即重新 configure。
- **Rationale**: 既有 `pushOutbox` 在無 Supabase 時會把所有 op 標成 `failed`，自動觸發會造成離線模式出現假錯誤（違反 FR-008），因此必須在 scheduler 層擋住，而不是靠 pushOutbox 回報。
- **Alternatives considered**: 改 `pushOutbox` 在無 Supabase 時靜默 skip — 會改變手動同步的既有語意，影響既有測試，不必要。

## R6. 路由攜帶查詢參數（「在此位置新增物品」預選）

- **Decision**: 路由邏輯狀態（`path` state、`pageCopy` 查表）維持只有 pathname；`navigate` 與內部連結攔截把 `url.search` 一併寫入 `history.pushState` 的實際 URL。`AddItemPage` 掛載時讀取 `window.location.search` 的 `locationId` 作為表單初始位置（僅在該位置存在且未刪除時採用）。
- **Rationale**: 對手寫路由改動最小；query 只是頁面初始參數，不需進入路由狀態機。
- **Alternatives considered**: ① sessionStorage 傳遞 — 隱性狀態、深連結不可分享；② 把 search 納入 path 狀態 — `pageCopy` 與 active tab 判斷全要跟著改，過度。

## R7. 返回鍵的「可否返回」判斷

- **Decision**: `AppShell` 以 ref 計數站內 `navigate()` 次數；返回鍵在計數 > 0 時呼叫 `history.back()`（popstate 既有處理會接手），否則導向 fallback 上層頁：`/items/*` → `/`、`/locations/*` → `/locations`、`/trash` → `/settings`。頂層路由（底部導覽五頁）不顯示返回鍵。
- **Rationale**: `history.length` 不可靠（含站外歷史）；App 工作階段內的站內導覽計數足以符合 spec「跨工作階段不追蹤」的假設。
- **Alternatives considered**: 以 `history.state` 塞自訂 marker — popstate 時要同步維護計數，複雜度更高、收益相同。

## R8. 位置詳情頁的資料組裝

- **Decision**: 新路由 `/locations/:id`（App.tsx 先比對 `=== '/locations'` 再比對 `startsWith('/locations/')`）。頁面複用既有 `collectDescendantLocationIds(locations, rootId)` 取得子樹 id 集合，`listItemsByHousehold` 過濾 `currentLocationId ∈ 子樹` 且 `status !== 'deleted'`；卡片複用 `ItemCard`，物品位於子位置時以 `locationPath` 呈現實際位置。位置編輯在詳情頁內嵌既有 `LocationForm`（editing 模式）。
- **Rationale**: 全部複用既有 helper 與元件，無新資料層；`ItemCard` 本來就吃 `locationPath`，子位置辨識天然成立。
- **Alternatives considered**: 建 per-location 索引查詢 — 資料量級（家庭庫存）不需要，全表過濾已是既有頁面模式。

## R9. 移除路由人為延遲

- **Decision**: `App.tsx` 的 `completeNavigation` 直接 `setPath` + `scrollTo(top)`，刪除 220ms `setTimeout`、`isRouteLoading` 狀態與 `RouteSkeleton`；`page-content-enter` 淡入動畫保留（不阻塞渲染）。捲動改為即時（`behavior: 'auto'`），避免內容已切換而畫面還在慢速捲動的錯位感。
- **Rationale**: 骨架的存在前提（真實載入延遲）不成立；保留輕量淡入維持質感。
- **Alternatives considered**: 縮短延遲（如 80ms）— 假延遲本質不變，直接移除。

## R10. 測試策略

- **Decision**: scheduler 以建構參數注入 `pushFn`/`pullFn`/時間函式，vitest fake timers 驗證：寫入去抖動合併、防重入、節流、disabled 模式零呼叫、stop 後不再觸發。UI 部分以 @testing-library/react + fake-indexeddb 加場景測試：位置詳情列出含子位置物品與空狀態、新增頁 query 預選位置、非頂層路由顯示返回鍵。既有 app 測試若斷言過場骨架（`頁面載入中`）需同步更新。
- **Rationale**: 沿用 repo「場景測試 + jsdom + fake-indexeddb」慣例（CLAUDE.md），不引入 e2e 框架。
- **Alternatives considered**: Playwright e2e — 超出本批範圍，實機驗收由使用者於部署後進行。
