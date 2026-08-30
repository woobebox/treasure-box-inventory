# Research: 平板智慧家居儀表板 UI／UX

**Feature**: `003-tablet-smart-home-ui` | **Date**: 2026-08-19

## R1. 平板導覽模式

**Decision**: 768px 以上使用左側 navigation rail，手機保留底部導覽；同一份 `bottomNavRoutes` 作為兩種呈現的資料來源。

**Rationale**: 現有 shell 與 bottom nav 均限制在 `max-w-md`，768px 模擬下左右留白且內容仍為手機密度。左側 rail 能讓平板垂直空間留給內容，符合智慧家居控制台的操作語彙，也不改變既有路由。

## R2. 最大內容寬度

**Decision**: app shell 最大 1024px，視窗更寬時置中；頁面內表單再使用 640–720px readable measure。

**Rationale**: 1024px 覆蓋常見平板橫向寬度，又避免桌面寬螢幕把卡片與文字拉得過寬。

## R3. UI primitive 邊界

**Decision**: 新增四個輕量前端元件 `Button`、`ActionLink`、`IconButton`、`ActionTile`，不引入第三方 UI library。

**Rationale**: 目前按鈕 class 分散在登入、設定、照片、位置、搜尋與詳情頁。抽出最小共用 primitive 可以集中處理觸控尺寸、focus、loading、danger 與按壓回饋，且不改既有資料或路由。

## R4. Semantic tokens 與 offline-first

**Decision**: token 寫在 `global.css`，頁面只使用語意化 class；沿用系統字型，不載入 Google Fonts。

**Rationale**: 既有 PWA 必須離線可用，外部字型會增加首次載入與離線失效風險。CSS token 可以在 light theme 維持對比並集中調整色彩、陰影與動效。

## R5. 首頁摘要資料

**Decision**: 首頁以既有 `listItemsByHousehold`、`listLocationsByHousehold` 與 `useSyncStatus` 組裝三個摘要，不建立新的 repository 或持久化 entity。

**Rationale**: 資料已存在；新增持久化欄位會擴大同步與 migration 範圍，與本功能只做 UI/UX 的邊界衝突。

## R6. 動效與可及性

**Decision**: pressed/focus 使用不改變周邊 layout 的 opacity、box-shadow 或輕微 transform；全域 reduced-motion 將 transition/animation 降至近乎零。

**Rationale**: 既有 `button, a` 全域 active transform 會讓所有連結位移，且 icon-only controls 有小於 44px 的案例。新 primitive 需明確狀態與 44–48px hit area，並保留鍵盤 focus。
