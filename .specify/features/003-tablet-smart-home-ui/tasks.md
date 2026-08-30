# Tasks: 平板智慧家居儀表板 UI／UX

**Input**: `.specify/features/003-tablet-smart-home-ui/` design documents
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, quickstart.md

## Phase 1: Setup

- [x] T001 建立 003 feature 文件並將 `.specify/feature.json` 指向 `.specify/features/003-tablet-smart-home-ui`
- [x] T002 [P] 建立 UI primitive 目錄與測試基礎檔案 `apps/web/src/components/ui/`

## Phase 2: Foundational UI system

- [x] T003 建立 semantic color、surface、radius、shadow、motion 與 safe-area tokens 於 `apps/web/src/styles/global.css`
- [x] T004 建立 `Button`、`ActionLink`、`IconButton`、`ActionTile` 於 `apps/web/src/components/ui/`
- [x] T005 [P] 建立 UI primitive 場景測試於 `apps/web/src/test/ui-primitives.test.tsx`
- [x] T006 移除全域 anchor/button layout-shifting active 行為，並保留 focus-visible 與 reduced-motion 規則於 `apps/web/src/styles/global.css`

## Phase 3: User Story 1 — 平板 responsive shell

- [x] T007 [US1] 重做 `AppShell` 的 mobile bottom nav、tablet navigation rail、1024px max shell 與 safe-area padding 於 `apps/web/src/app/App.tsx`
- [x] T008 [P] [US1] 擴充 route navigation 回歸測試，驗證 mobile/rail 共用 route source 於 `apps/web/src/test/app-back-navigation.test.tsx`
- [x] T009 [US1] 補 responsive shell 與 page container utility styles 於 `apps/web/src/styles/global.css`

## Phase 4: User Story 2 — 首頁儀表板

- [x] T010 [US2] 擴充首頁資料載入，加入物品數、位置數、待同步摘要於 `apps/web/src/features/home/HomePage.tsx`
- [x] T011 [US2] 加入三個大型快捷控制、空狀態 CTA 與平板最近物品雙欄於 `apps/web/src/features/home/HomePage.tsx`
- [x] T012 [P] [US2] 擴充首頁場景測試，驗證摘要、快捷控制、空狀態與位置路徑於 `apps/web/src/test/home-recent-location.test.tsx`

## Phase 5: User Story 3 — 全 App controls

- [x] T013 [P] [US3] 將登入與註冊表單套用共用 controls 並提升平板可讀寬度於 `apps/web/src/features/auth/LoginPage.tsx`
- [x] T014 [P] [US3] 將位置節點、位置表單、刪除 modal 套用共用 controls 於 `apps/web/src/features/locations/LocationsPage.tsx`、`apps/web/src/features/locations/LocationForm.tsx`
- [x] T015 [P] [US3] 將照片、移動、物品刪除／還原控制套用共用 controls 於 `apps/web/src/features/items/PhotoInput.tsx`、`apps/web/src/features/items/PhotoGallery.tsx`、`apps/web/src/features/items/MoveItemDialog.tsx`、`apps/web/src/features/items/ItemDetailPage.tsx`
- [x] T016 [P] [US3] 將設定、備份、同步、選項與家庭成員控制套用共用 controls 於 `apps/web/src/features/settings/`、`apps/web/src/features/households/`
- [x] T017 [US3] 將新增物品表單、分類／標籤／位置 picker 套用共用 controls並保留既有驗證於 `apps/web/src/features/items/AddItemPage.tsx`、`apps/web/src/features/categories/`、`apps/web/src/features/tags/`、`apps/web/src/features/locations/LocationPicker.tsx`

## Phase 6: User Story 4 — 各頁平板版面

- [x] T018 [P] [US4] 將搜尋 filters 與結果改為響應式平板 layout，維持既有搜尋行為於 `apps/web/src/features/search/SearchFilters.tsx`、`apps/web/src/features/search/SearchPage.tsx`
- [x] T019 [P] [US4] 將物品卡片、物品詳情、位置詳情改為資訊／操作雙欄與可讀 grid 於 `apps/web/src/features/items/ItemCard.tsx`、`apps/web/src/features/items/ItemDetailPage.tsx`、`apps/web/src/features/locations/LocationDetailPage.tsx`
- [x] T020 [US4] 將設定頁區塊改為 responsive card grid，家庭／成員區塊跨欄於 `apps/web/src/app/App.tsx`、`apps/web/src/features/settings/`、`apps/web/src/features/households/HouseholdSettingsPage.tsx`

## Phase 7: User Story 5 — accessibility and verification

- [x] T021 [P] [US5] 補 dynamic status、icon labels、form labels 與 focus order 場景測試於 `apps/web/src/test/ui-primitives.test.tsx`、`apps/web/src/app/App.test.tsx`
- [x] T022 [US5] 以 375×812、768×1024、1024×768 做本機瀏覽器視覺驗收，記錄結果於 `.specify/features/003-tablet-smart-home-ui/quickstart.md`
- [x] T023 [US5] 執行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 與 `git diff --check`，修正所有回歸問題

## Phase 8: Polish and handoff

- [x] T024 [P] 重新讀取修改檔案並檢查 placeholder、raw color、水平捲動與未標籤 icon button
- [x] T025 更新 `.specify/memory/active_session.md` 狀態頭與 Session Log，記錄完成項目、實際驗證、阻塞與下一步

## Dependencies

`T001 → T003–T006 → T007 → T010–T012 → T013–T020 → T021–T025`。

T005、T008、T012、T013–T016、T018–T019、T021、T024 可在其前置共用元件完成後平行處理；同一檔案的任務仍需順序執行。

## Implementation Strategy

先完成共用 primitive 與 shell，再交付首頁儀表板，接著套用全 App controls 與頁面 grid，最後做 accessibility、瀏覽器尺寸驗收與全套驗證。所有工作維持既有資料流與路由，若驗證失敗只修正本功能相關的 UI／測試回歸。
