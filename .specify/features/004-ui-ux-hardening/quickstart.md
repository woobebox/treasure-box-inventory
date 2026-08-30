# Quickstart: 全 App UI／UX 完成度強化

**Feature**: `004-ui-ux-hardening` | **Date**: 2026-08-27

## Automated Verification

在 `apps/web`：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

在 repository root：

```bash
git diff --check
```

實際結果（2026-08-27）：

- `npm run typecheck`：成功。
- `npm run lint`：成功，0 warnings。
- `npm test`：成功，26 test files / 63 tests。
- `npm run build`：成功；僅保留既有單一 bundle 大於 500 kB 提示。
- `git diff --check`：成功。

## Browser Matrix

### 375×812

- 手機 bottom nav 不遮內容。
- 首頁 loading 不先顯示零筆／empty。
- 照片、成員、位置 tree 不水平溢出。
- 搜尋 sticky controls 與 200% 文字縮放仍可操作。

### 768×1024

- rail 與 header 不互相撐高。
- 快捷控制為兩欄可讀密度。
- 搜尋結果、設定卡片與詳情雙欄不過度擁擠。
- Toast 不保留手機 bottom-nav 的偏移。

### 1024×768

- shell 維持 1024px 上限。
- 快捷控制可使用三欄。
- dialog 完整位於 viewport 且可鍵盤操作。

## Interaction Scenarios

1. 將 repository Promise 延遲 500ms，檢查 loading → data／empty／error。
2. 搜尋輸入、設定進階篩選、進詳情、返回，確認 URL、控制值與 scroll 恢復。
3. 連續搜尋並讓舊 Promise 晚回，確認不覆蓋新結果。
4. Tab 進入 skip link、切換 route、確認 main focus。
5. 開啟每一種危險操作 dialog，驗證 Tab loop、Shift+Tab、Escape、busy、焦點還原。
6. 觸發 success、info、error Toast，驗證 announcement 與關閉控制。
7. 啟用 reduced-motion 與 200% zoom，檢查內容不截斷、不水平捲動。

## Contract Regression

- IndexedDB schema/version 不變。
- Supabase schema/function 不變。
- sync payload 與權限不變。
- pathname routes 與 mobile/tablet navigation source 不變。

## Current Visual Verification Status

- 自動化已驗證：route focus、skip link、dialog focus trap／Escape／focus restore、Toast announcement／close、搜尋 250ms debounce／race guard／URL round-trip、新增物品 first-invalid focus、loading 不誤顯 empty、sync completion timestamp。
- 內建瀏覽器可見既有 `http://127.0.0.1:5174/` 分頁，但自動重新載入 localhost 被瀏覽器安全政策阻擋；依政策未改用其他瀏覽器或繞過方式。
- T026 三 viewport 新版畫面與 T027 的 200% zoom／實際 reduced-motion 操作仍待使用者在現有本機預覽分頁重新整理後驗收；不影響自動化與 build 結果。
