# Quickstart 驗證指南: 手機 UX 優化第一批

**Feature**: `002-mobile-ux-uplift` | **Date**: 2026-07-14

## 前置需求

- repo root 執行 `npm install`（一次即可）。
- 雲端情境需要 `apps/web/.env`（`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`）；純離線情境不需要。

## 自動化驗證（全部 repo root 執行）

```bash
npm run typecheck
npm run lint
npm run test          # 需含新測試：sync-scheduler、location-detail、app-back-navigation
npm run build
```

預期：全綠；vitest 檔案數與測試數比基準（18 files / 39 tests）增加。

## 手動驗證情境

### A. 自動同步（US1，需 Supabase env）

1. `npm run dev`，瀏覽器 A 登入並選家庭 → 首頁應顯示同步狀態指示（膠囊），啟動後自動完成一次同步。
2. 在 A 新增一筆物品 → 不做任何手動同步，約 3 秒內指示顯示同步中→成功，待同步筆數歸零。
3. 無痕視窗 B 同帳號登入 → 啟動即自動拉取，看得到 A 的新物品；切到其他分頁再切回 B（超過 30 秒節流窗）→ 自動再拉取。
4. DevTools Network 切 Offline，在 A 新增物品 → 指示顯示待同步筆數、無錯誤彈窗；恢復 Online → 自動推送並歸零。
5. 點首頁指示 → 立即觸發同步且同步中不可重複觸發；設定頁「立即同步」仍可用，兩處狀態一致。

### B. 純離線模式（US1／FR-008）

1. 移除／不設 `.env` 後 `npm run dev` → 首頁指示顯示純離線文案、不可點；Console 無同步錯誤；新增/編輯/搜尋照常。

### C. 即時導覽（US3）

1. 底部導覽任意切換 → 頁面立即出現，無骨架過場（DOM 中不應再出現 `aria-label="頁面載入中"`）。

### D. 位置詳情（US2）

1. 位置頁建立巢狀位置（如 儲藏室 > 箱子A），在箱子A 放一筆物品。
2. 點「儲藏室」名稱 → 進入 `/locations/:id`：顯示名稱、類型、路徑，物品清單包含箱子A 的物品且卡片可辨識實際位置。
3. 點「在此位置新增物品」→ 新增頁位置欄已預選該位置；存檔後回詳情頁可見新物品。
4. 空位置 → 顯示空狀態文案與新增入口。位置節點的編輯改用明確編輯鈕（原點名稱＝進詳情）。

### E. 返回鍵（US4）

1. 首頁點物品卡 → 詳情頁 header 有「返回」鈕，點擊回首頁。
2. 直接輸入 `/items/<id>` 網址冷開（無站內歷史）→ 返回鈕導向首頁；`/trash` 冷開 → 導向設定頁；`/locations/<id>` 冷開 → 導向位置頁。
3. 首頁等五個頂層分頁 → header 無返回鈕。

## 已知不在本批範圍

- 照片 Blob 跨裝置同步（後續批次）。
- 位置詳情大量物品的分頁／虛擬化。
- 實機 iOS standalone 驗收於 GitHub Pages 部署後進行。
