# Tasks: 手機 UX 優化第一批（自動同步、即時導覽、位置瀏覽、返回鍵）

**Input**: Design documents from `.specify/features/002-mobile-ux-uplift/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 本 repo 慣例（CLAUDE.md）要求同步邏輯與 repository 變更必須配套場景測試，故包含測試任務。

**Organization**: 依使用者故事分組；US1–US4 各自可獨立完成與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行（不同檔案、無未完成依賴）
- **[Story]**: 對應 spec.md 的使用者故事（US1–US4）

## Phase 1: Setup

- [X] T001 確認基準綠燈：repo root 執行 `npm run typecheck && npm run lint && npm run test`，記錄目前測試基準（18 files / 39 tests）以供收尾比對

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: US2 的「在此位置新增物品」與 US4 的返回導覽都依賴路由層能攜帶 query string。

- [X] T002 `apps/web/src/app/App.tsx`：`handleInternalLink` 與 `navigate` 支援攜帶 `url.search`——`history.pushState` 寫入 `toHref(path) + search`，邏輯 `path` state 維持只存 pathname（見 research R6）

**Checkpoint**: 站內連結帶 query 時網址列保留 query、路由狀態不受影響。

---

## Phase 3: User Story 1 - 家庭資料自動同步 (Priority: P1) 🎯 MVP

**Goal**: 使用者無需進設定頁，寫入後、啟動時、回前景、網路恢復都自動同步；首頁有可點擊的同步狀態指示。

**Independent Test**: 兩瀏覽器同帳號登入；A 新增物品後 B 只做「重開/切回」即可看到；離線寫入恢復連線後自動推送（quickstart A/B 情境）。

### Implementation for User Story 1

- [X] T003 [US1] 新增 `apps/web/src/sync/syncScheduler.ts`：模組單例，`configure({ householdId, deviceId, enabled, pushFn?, pullFn? })` / `stop()` / `requestSync(reason)` / `notifyLocalWrite()` / `getState()` / `subscribe(listener)`；行為：寫入去抖動 2.5s、`visibilitychange`/`online` 觸發完整同步（30s 節流、startup 不受限）、in-flight Promise 防重入、`db.syncOps.hook('creating')` 為本地寫入 choke point（enabled 時註冊、stop 時解除）、每次同步後重算 `pendingCount`（`status !== 'synced'`）；`pushFn`/`pullFn` 預設綁 `pushOutbox`/`pullChanges`、可注入供測試（見 research R1–R5）
- [X] T004 [US1] 新增 `apps/web/src/sync/useSyncStatus.ts`：`useSyncStatus()`（`useSyncExternalStore` 包 scheduler 狀態）與 `useAutoSync()`（依 `useHousehold()` 與 `supabase` 是否設定決定 `configure`/`stop`，effect 依賴 `[householdId, deviceId]`，cleanup 呼叫 `stop()`）
- [X] T005 [US1] `apps/web/src/app/App.tsx`：`AppShell` 掛載 `useAutoSync()`（依賴 T004）
- [X] T006 [P] [US1] `apps/web/src/features/home/HomePage.tsx`:待同步文字列改為可點擊同步狀態膠囊——顯示待同步筆數與 phase（進行中轉圈／成功／失敗圖示），點擊呼叫 `requestSync('manual')`；純離線模式顯示「純離線模式」且不可點；文案繁中
- [X] T007 [P] [US1] `apps/web/src/features/settings/SyncSettings.tsx`：「立即同步」改走 `scheduler.requestSync('manual')` 並以 `useSyncStatus()` 呈現狀態與 `reasons` 明細，同步中禁用按鈕（與首頁共用同一狀態來源）
- [X] T008 [US1] 新增 `apps/web/src/test/sync-scheduler.test.ts`（fake timers + 注入 pushFn/pullFn）：①連續多筆 `notifyLocalWrite` 在去抖動窗內只觸發一次 push；②同步進行中重複 `requestSync` 不並發；③前景/上線觸發受 30s 節流、startup 不受限；④`enabled: false` 時零呼叫、不註冊 hook；⑤`stop()` 後計時器與事件不再觸發

**Checkpoint**: US1 可獨立驗證（quickstart A/B 情境）；純離線模式無任何同步錯誤。

---

## Phase 4: User Story 2 - 打開位置看裡面有什麼 (Priority: P2)

**Goal**: 點位置名稱進入詳情頁,看到該位置（含子位置）物品,可由此新增（位置預選）與編輯位置。

**Independent Test**: 建巢狀位置與物品後,從位置頁兩次點擊內看到子樹物品清單;「在此位置新增物品」進入新增頁且位置已預選（quickstart D 情境）。

### Implementation for User Story 2

- [X] T009 [P] [US2] 新增 `apps/web/src/features/locations/LocationDetailPage.tsx`：載入家庭位置與物品，`collectDescendantLocationIds` 過濾子樹物品（排除 `status === 'deleted'`；直屬在前、子位置在後，各依 `updatedAt` 新→舊）；標頭：名稱、`formatLocationType`、完整 path、物品數；動作列：「在此位置新增物品」（`<a href={toHref('/add') + '?locationId=' + id}>`）與「編輯位置」（toggle 內嵌 `LocationForm` editing 模式，onSaved 重載）；`ItemCard` 帶 `locationPath` 辨識子位置；空狀態與「找不到位置」（含回位置頁連結）文案繁中
- [X] T010 [US2] `apps/web/src/app/App.tsx`：路由加 `path.startsWith('/locations/')` → `LocationDetailPage`（`decodeURIComponent` 取 id；`=== '/locations'` 仍為列表）；`pageCopy` 加位置詳情標題（依賴 T009）
- [X] T011 [P] [US2] `apps/web/src/features/locations/LocationsPage.tsx`：`Node` 的位置名稱改為 `<a>` 連到 `/locations/:id`；新增鉛筆編輯鈕（觸控目標 ≥ 40px、`aria-label`）呼叫原 `onEdit`；刪除鈕行為不變
- [X] T012 [US2] `apps/web/src/features/items/AddItemPage.tsx`：mount 時讀 `window.location.search` 的 `locationId`，該位置存在且未刪除時設為表單初始位置（依賴 T002）
- [X] T013 [US2] 新增 `apps/web/src/test/location-detail.test.tsx`（@testing-library/react + fake-indexeddb）：①詳情頁列出直屬與子位置物品且子位置可辨識；②空位置顯示空狀態與新增入口；③不存在的位置顯示「找不到位置」；④`/add?locationId=` 預選位置

**Checkpoint**: US2 可獨立驗證（quickstart D 情境）。

---

## Phase 5: User Story 3 - 頁面切換即時反應 (Priority: P3)

**Goal**: 移除 220ms 人為骨架延遲,站內導覽即時。

**Independent Test**: 底部導覽切換即時渲染,DOM 不再出現 `aria-label="頁面載入中"`（quickstart C 情境）。

### Implementation for User Story 3

- [X] T014 [US3] `apps/web/src/app/App.tsx`：`completeNavigation` 直接 `setPath` + `window.scrollTo({ top: 0 })`（即時捲動），刪除 `setTimeout(220)`、`isRouteLoading`、`routeTimer` 與 `RouteSkeleton` 元件；保留 `page-content-enter` 淡入
- [X] T015 [US3] 清理與測試對齊：`apps/web/src/global.css`（或對應樣式檔）移除僅供骨架使用的 `skeleton-block` 樣式（若無他處引用）；搜尋並更新 `apps/web/src/test/` 中斷言「頁面載入中」骨架的既有測試

**Checkpoint**: US3 可獨立驗證；既有測試全綠。

---

## Phase 6: User Story 4 - 非頂層頁面有返回鍵 (Priority: P4)

**Goal**: 物品詳情、位置詳情、回收桶 header 顯示返回鍵;無站內歷史時導向合理上層頁。

**Independent Test**: 站內進入詳情頁點返回回上一頁;冷開深連結點返回到 fallback 上層頁;頂層五頁無返回鍵（quickstart E 情境）。

### Implementation for User Story 4

- [X] T016 [US4] `apps/web/src/app/App.tsx`：新增 `inAppNavCount` ref（`navigate()` +1、popstate -1 不低於 0）；header 於 `path` 非底部導覽五頁時顯示返回鈕（lucide `ArrowLeft`、`aria-label="返回"`、觸控目標 ≥ 44px）；點擊：count > 0 → `history.back()`，否則 fallback：`/items/*`→`/`、`/locations/*`→`/locations`、`/trash`→`/settings`、其他→`/`（見 research R7）
- [X] T017 [US4] 新增 `apps/web/src/test/app-back-navigation.test.tsx`：①物品詳情路由顯示返回鈕、頂層路由不顯示；②無站內歷史時點擊導向 fallback 上層頁（`/trash`→設定）；③站內導覽後點擊回上一頁

**Checkpoint**: 全部四個故事可獨立驗證。

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T018 全套驗證：repo root `npm run typecheck && npm run lint && npm run test && npm run build`，測試數應高於 T001 基準；依 `quickstart.md` 以 `npm run dev` 走 A–E 手動情境（含純離線模式）
- [X] T019 更新 `.specify/memory/active_session.md`：頂部摘要 + Session Log 新增本次完成項、驗證結果、blockers、下一步（部署後實機驗收）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1（T001）**: 無依賴，先跑基準。
- **Phase 2（T002）**: 阻塞 US2 的 T012 與 US4 的返回導覽驗證；建議緊接 T001。
- **US1（T003–T008）**: 僅依賴 Phase 1；與 Phase 2 無關，可與 T002 平行。
- **US2（T009–T013）**: T009/T011 可先行；T010 依賴 T009；T012 依賴 T002；T013 依賴 T009–T012。
- **US3（T014–T015）**: 僅依賴 Phase 1；因同檔 `App.tsx`，建議在 T005/T010 之後接續處理避免衝突。
- **US4（T016–T017）**: T016 依賴 T002（fallback 導覽）；同檔 `App.tsx` 建議最後改。
- **Polish（T018–T019）**: 依賴全部完成。

### 同檔衝突提醒

`App.tsx` 被 T002、T005、T010、T014、T016 依序修改——這五個任務不可平行,建議依編號順序執行。

### Parallel Opportunities

- T003 完成後：T006、T007 可平行（不同檔案）。
- T009、T011 可平行（不同檔案）。
- 測試任務 T008、T013、T017 各自獨立檔案，可於對應故事實作完成後平行撰寫。

---

## Implementation Strategy

**MVP = Phase 1–3（US1 自動同步）**：完成即解決最大體驗缺口，可先行驗收部署。其後依 P2→P3→P4 增量交付；US3/US4 改動小，若同 session 進行建議照 T014→T016 順序一次處理 `App.tsx` 收尾。每完成一個故事跑一次 `npm run test` 保持綠燈。
