# Implementation Plan: 平板智慧家居儀表板 UI／UX

**Branch**: `003-tablet-smart-home-ui` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

## Summary

以現有 React 手寫路由、Tailwind、Lucide 與 IndexedDB 資料流為基礎，新增平板 navigation rail、首頁庫存摘要與快捷控制，並抽出共用互動元件和語意化 token。手機維持底部導覽；平板與更大視窗使用最大 1024px 的置中 shell。所有資料仍來自既有 repositories 與 `useSyncStatus`，不改後端合約。

## Technical Context

**Language/Version**: TypeScript + React function components
**Primary Dependencies**: Vite、Tailwind CSS、lucide-react、Dexie、@testing-library/react、Vitest
**Storage**: 既有 IndexedDB / Supabase；本功能不新增 schema
**Testing**: Vitest + jsdom + fake-indexeddb + Testing Library；瀏覽器尺寸以本機視覺驗收
**Target Platform**: 行動瀏覽器優先 PWA；手機、直向平板、橫向平板
**Project Type**: 單一 Web 前端（`apps/web`）
**Performance Goals**: 主要互動於 100ms 內有視覺回饋；微動效 150–220ms；不引入遠端字型或新依賴
**Constraints**: 離線優先、繁體中文、既有路由與資料流不變、平板最大 1024px

## Constitution Check

- ✅ 離線優先：首頁摘要只讀本機資料；無網路不阻塞既有操作。
- ✅ 授權邊界不變：不新增寫入、權限或後端操作。
- ✅ Spec-first：本功能有完整 spec、plan、tasks 與 quickstart 後才實作。
- ✅ 場景測試：新增 UI primitive、首頁摘要與導覽回歸場景測試。
- ✅ 繁體中文：所有新文案與狀態文字使用繁體中文。
- ✅ 無新依賴：沿用現有 Tailwind、Lucide、React 與測試工具。

## Project Structure

```text
apps/web/src/
├── app/App.tsx                         # [改] responsive shell、rail、mobile nav、頁面版面
├── components/ui/                      # [新] Button、ActionLink、IconButton、ActionTile
├── styles/global.css                   # [改] semantic tokens、focus、motion、safe-area
├── features/home/HomePage.tsx          # [改] 摘要、快捷控制、空狀態與平板 grid
├── features/auth/LoginPage.tsx         # [改] responsive login card 與 controls
├── features/items/                     # [改] 新增、卡片、詳情、照片與移動控制
├── features/locations/                 # [改] 節點、詳情、表單控制與平板欄位
├── features/search/                    # [改] filters、結果 grid、控制狀態
├── features/settings/                  # [改] settings grid、按鈕與危險操作層級
└── test/                               # [新/改] UI、首頁、導航與回歸測試
```

## Design Decisions

### Responsive shell

- `md` breakpoint（768px）切換 rail；手機仍使用 fixed bottom nav。
- Shell 使用 `max-width: 1024px`，內容區預留 rail 寬度；平板頁面不再套單一 max-w-md 白卡。
- Main content 使用 `min-width: 0`、安全區 padding 與頁面層級 grid，避免長文字或階層樹造成水平捲動。

### Shared interaction primitives

- `Button` 提供 `primary | secondary | ghost | danger` 與 `md | lg`，支援 `busy`、leading icon、full width。
- `ActionLink` 保留原生 anchor 語意並共用 Button 視覺。
- `IconButton` 強制 `aria-label`，視覺圖示可小於 44px 但 hit area 不小於 48px。
- `ActionTile` 用於首頁三個快捷入口，整張 tile 是單一操作目標。
- 所有 primitive 使用 semantic CSS classes，不在頁面內重複 raw hex 或狀態邏輯。

### Home dashboard data

- 物品總數取 `listItemsByHousehold` 回傳數量。
- 位置總數取 `listLocationsByHousehold` 回傳數量。
- 待同步取 `useSyncStatus().pendingCount`；純離線仍顯示純離線狀態。
- 最近物品沿用既有排序與 location path 對照；空狀態連至 `/add`。

### Page adaptations

- 新增表單以 `md:grid-cols-2` 分組，照片與標籤等次要區塊在平板保持清楚閱讀順序。
- 搜尋結果與首頁最近物品在平板使用兩欄。
- 設定區塊在平板使用 responsive grid，家庭／成員區塊跨欄。
- 詳情頁在平板以資訊與操作雙欄，歷史紀錄仍維持單欄閱讀。
- Modal、photo controls、location tree 與所有既有操作改用共用控制規格。

## Compatibility and Risks

- CSS media query 在 jsdom 無法完整模擬，因此尺寸驗收需搭配本機瀏覽器 375/768/1024 三種 viewport。
- 現有測試會 mock `useSyncStatus` 或 context；新增首頁摘要時需保留缺省值，避免舊測試因 mock 不完整而失敗。
- 不修改 router、repository、sync scheduler、DB schema、Supabase functions 或 PWA base path。

## Implementation Order

1. 建立 UI primitives 與 semantic tokens。
2. 重做 App shell 與 responsive navigation。
3. 改造首頁摘要、快捷控制與最近物品 grid。
4. 依頁面群組套用 controls、grid、表單與詳情版面。
5. 補測試、跑 typecheck/lint/test/build，最後做三種 viewport 視覺驗收。
