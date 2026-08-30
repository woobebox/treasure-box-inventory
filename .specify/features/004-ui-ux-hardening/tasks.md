# Tasks: 全 App UI／UX 完成度強化

**Input**: `.specify/features/004-ui-ux-hardening/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, quickstart.md

## Phase 1: Specify and foundation

- [x] T001 建立 004 spec、plan、tasks、research、data-model、quickstart 並切換 active feature
- [x] T002 建立／擴充 `LoadingState`、`EmptyState`、`ErrorState`
- [x] T003 新增 accessible `ConfirmDialog` primitive 與場景測試
- [x] T004 重構 Toast 為 live-region + 獨立關閉控制並補測試
- [x] T005 補 semantic contrast、skip-link、skeleton、pointer 與 focus token 樣式

## Phase 2: Navigation and state continuity

- [x] T006 [US3] AppShell 加入 skip link、main focus、頁面描述與 history scroll snapshot
- [x] T007 [US2] 新增搜尋 filter query parse／serialize 與 250ms debounce
- [x] T008 [US2] 搜尋加入 request race guard、loading/error、aria-live、clear-all
- [x] T009 [P] 新增搜尋返回狀態、過期結果與 route focus 測試

## Phase 3: Async state and dashboard

- [x] T010 [US1] 首頁加入 loading/error/skeleton，避免 0／empty flash
- [x] T011 [US4] 首頁 quick actions 在 768px 兩欄、足夠寬度才三欄
- [x] T012 [US5] sync scheduler 增加 runtime lastCompletedAt，首頁顯示最近結果
- [x] T013 [P] 物品詳情、位置、位置詳情、回收桶加入 loading/error/retry
- [x] T014 [P] 擴充首頁與詳情 async state 測試

## Phase 4: Safe actions and forms

- [x] T015 [US5] 物品刪除、位置刪除改用共用 ConfirmDialog
- [x] T016 [US5] 照片移除、自訂選項刪除、成員移除加入確認與 busy/error
- [x] T017 [US6] 新增物品補 required/error relation/first-invalid focus 與未儲存 beforeunload
- [x] T018 [US6] 登入補 autocomplete、密碼顯示切換與成功/error tone
- [x] T019 [US6] 家庭設定移除 nested main、補可見 labels；成員列響應式排列並統一 Lucide icon

## Phase 5: Information density and consistency

- [x] T020 [US4] 位置新增表單改漸進揭露，位置樹改可收合且限制深層縮排
- [x] T021 [P] 照片操作維持 48px、手機兩欄並補 busy/error/alt
- [x] T022 [P] 設定控制補 busy/disabled reason、可見 labels 與較清楚分組
- [x] T023 全 App 修正必要小字對比、raw focus color 與 clickable cursor

## Phase 6: Verification and handoff

- [x] T024 補 ConfirmDialog、Toast、search、loading、form focus、member actions 回歸測試
- [x] T025 執行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`、`git diff --check`
- [ ] T026 以 375×812、768×1024、1024×768 驗收首頁與主要路由，檢查 overflow／固定導覽／dialog
- [ ] T027 驗證鍵盤 focus、200% 文字縮放、reduced-motion 與必要對比
- [x] T028 更新 tasks、quickstart 與 `.specify/memory/active_session.md`

## Dependencies

`T001 → T002–T005 → T006–T014 → T015–T023 → T024–T028`

同一 runtime 檔案依序修改；測試可在對應 primitive／頁面完成後立即加入。任何資料 contract 回歸先停止 UI 擴張並修正。
