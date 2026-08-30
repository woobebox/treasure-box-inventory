# Quickstart 驗證指南: 平板智慧家居儀表板 UI／UX

**Feature**: `003-tablet-smart-home-ui` | **Date**: 2026-08-19

## 自動化驗證

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

預期：全部成功；允許既有 Vite bundle size warning，但不得有 typecheck、lint、test 或 build error。

實際結果（2026-08-19）：

- `npm run typecheck`：成功。
- `npm run lint`：成功，0 warnings。
- `npm test`：成功，22 test files / 57 tests。
- `npm run build`：成功；Vite 僅保留既有單一 bundle 大於 500 kB 的提示。
- `git diff --check`：成功。

## 瀏覽器驗證

### A. 手機 375×812

1. 開啟純離線模式首頁。
2. 確認底部五項導覽仍可見，內容不被導覽遮住。
3. 點擊首頁三個快捷控制，確認進入 `/add`、`/search`、`/locations`。
4. 開啟新增、搜尋、位置、設定、物品詳情與位置詳情，確認沒有水平捲動。

實際結果：已使用本機 Vite + Playwright screenshot 驗證首頁 375×812；底部五項導覽、safe-area 間距與空狀態 CTA 可見，畫面未出現水平溢出。新增／搜尋／位置／設定路由另於 768px 直向檢查。

### B. 平板直向 768×1024

1. 確認左側 navigation rail 取代底部導覽，包含圖示、文字與 active 狀態。
2. 確認右側頁首、首頁摘要與三個大型快捷控制使用平板空間。
3. 確認最近物品、搜尋結果與設定區塊可使用雙欄。
4. 確認所有 icon button hit area 至少 48px，鍵盤 focus 清楚可見。

實際結果：已驗證首頁、`/add`、`/search`、`/locations`、`/settings` 768×1024 截圖；左側 rail 取代底部導覽、active 狀態一致、表單與設定使用雙欄、首頁快捷控制與最近物品區塊保持可讀，頁首不再被 rail 撐高。

### C. 平板橫向 1024×768

1. 確認 shell 仍以 1024px 為最大寬度且不產生水平捲動。
2. 確認表單文字保持可讀寬度，不被拉成過長單行。
3. 確認固定 rail、頁首與內容不互相遮蔽，捲動可到達所有操作。

實際結果：已驗證首頁 1024×768 截圖；shell 以 1024px 為上限置中，rail／頁首／內容分區正常，沒有水平溢出或互相遮蔽。表單與設定頁仍使用 readable container／雙欄規則。

### D. 可及性與狀態

1. 以鍵盤逐項 Tab，確認 rail、快捷控制、表單與彈窗順序正確。
2. 觸發載入、停用、錯誤、成功與危險操作，確認不只靠顏色傳達狀態。
3. 開啟 `prefers-reduced-motion`，確認頁面與控制不出現干擾動畫。
4. 將瀏覽器文字放大，確認首頁與設定頁不截斷主要文案。

自動化覆蓋：shared primitive 測試驗證 Button variant、busy/disabled/aria-busy、IconButton accessible name 與 48px class、ActionLink／ActionTile 原生連結語意；App navigation 測試驗證頂層頁返回鍵與詳情 fallback。實機鍵盤循序與文字放大仍建議在正式裝置上做一次 release smoke test。

## 已知不在本批範圍

- 真正的燈光、溫度、能源或其他智慧家居裝置控制。
- 深色模式與主題切換。
- IndexedDB、Supabase schema、同步 payload、權限模型與既有路由變更。
