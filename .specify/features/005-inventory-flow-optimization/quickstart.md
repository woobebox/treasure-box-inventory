# Quickstart: 收納流程與 UI 維護優化

## Automated

在 repository root 執行 `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` 與 `git diff --check`。

2026-09-09 結果：typecheck、lint、29 test files／71 tests、production build、diff check 全部通過。路由拆分後最大 entry chunk 由 641.54 kB 降為 229.02 kB；Supabase 與 Dexie 分為獨立 chunk，建置不再出現 500 kB 警告。

## Manual scenarios

1. 編輯物品名稱、分類、備註、標籤；重新開啟確認一致，並檢查歷史與待同步數。
2. 在同一位置連續新增三件；每筆不得沿用前一筆照片、名稱、備註或標籤。
3. 填表後重新整理確認草稿恢復；切換家庭不得看見另一家庭草稿。
4. 填表後點首頁／搜尋／返回，分別測試取消與捨棄。
5. 搜尋切換排序與卡片／清單，進詳情後返回確認 URL 與畫面一致。
6. `/ui-preview` 僅在開發模式呈現；production build 不顯示內容。
7. 375×812、768×1024、1024×768 檢查 fixed nav、dialog、overflow；另驗證 200% zoom、鍵盤與 reduced-motion。

## Browser result

- 375×812：首頁與搜尋無水平 overflow，核心快捷操作在摘要前；搜尋 URL 正確恢復 `sort=name-asc&view=list`；未儲存導覽顯示 ConfirmDialog 並停留 `/add`。
- 768×1024：tablet rail 顯示、mobile nav 隱藏、快捷操作兩欄、無水平 overflow。
- 1024×768：快捷操作三欄；修正原 `min-[960px]` 被 `md:grid-cols-2` 覆寫的 cascade 問題，改用有序 `lg:grid-cols-3` 後複驗通過。
- 1366×1024：外層由固定 1024px 上限擴展為 1280px，寬平板左右留白由 171px 降至 43px；側欄於 `xl` 擴展至 128px，內容仍保留可讀寬度。
- `/ui-preview`：開發模式可見所有新增共用元件，browser console 無 error／warning。
- 200% zoom 與實際 reduced-motion 模擬未執行；CSS reduced-motion 規則仍存在，T013 保留未完成。
