# Supabase 後端部署步驟

本文件說明如何把這個 local-first PWA 的雲端後端建立到 Supabase。完成後，多個裝置登入同一個 household 即可同步物品、位置、標籤與歷史紀錄。

> 重要前提：App 本身**離線就能完整使用**。只有當你想要「跨裝置同步」時才需要做以下設定。若 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 留空，App 會自動以純本地模式運作（見 `apps/web/src/services/supabaseClient.ts`）。
>
> 本次同步範圍為**文字資料**（item / location / tag / history）。照片本體目前仍只存在各裝置本機，**不會跨裝置**，因此 B 裝置看得到物品資料但看不到 A 拍的照片。

## 0. 安裝 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase
supabase --version
```

## 1. 建立 Supabase 專案並取得金鑰

1. 到 <https://supabase.com> 建立一個專案（免費方案即可）。
2. 進入專案的 **Project Settings → API**，記下：
   - **Project URL**（形如 `https://xxxxxxxx.supabase.co`）→ 之後填 `VITE_SUPABASE_URL`
   - **anon public key** → 之後填 `VITE_SUPABASE_ANON_KEY`
3. 在 **Project Settings → General** 記下 **Reference ID**（project ref，形如 `xxxxxxxxxxxxxxxxxxxx`）。

## 2. 登入並連結專案

於 repo 根目錄執行：

```bash
supabase login                          # 開瀏覽器完成授權
supabase link --project-ref <你的 project ref>
```

`supabase link` 會把本地 `supabase/`（含 `config.toml`、`migrations/`、`functions/`）綁定到雲端專案。

## 3. 套用資料庫 schema 與權限

```bash
supabase db push
```

這會依序套用 `supabase/migrations/` 下的：

| 檔案 | 內容 |
|------|------|
| `001_households_members.sql` | 家庭、成員（admin/member、邀請狀態） |
| `002_inventory_core.sql` | items / locations / photos / tags / item_tags |
| `003_sync_history_backup.sql` | history / sync_ops / device_sync / conflicts / backup_snapshots |
| `004_rls_policies.sql` | Row Level Security（成員才可讀寫，admin 才可刪除/管理成員） |
| `005_storage_policies.sql` | 照片 Storage bucket 與存取政策 |

## 4. 部署 Edge Function（同步 API）

```bash
supabase functions deploy sync
```

`sync` 是單一函式，內部以 `functions/sync/index.ts` 路由分派：

- `sync/push` → `functions/sync/push.ts`（上傳本地 SyncOp，落地寫入實體表，回傳 acks/conflicts）
- `sync/changes` → `functions/sync/changes.ts`（依 cursor 拉取家庭變更）

前端對應呼叫在 `apps/web/src/sync/outbox.ts`（`functions.invoke('sync/push', ...)`）與 `apps/web/src/sync/pull.ts`（`functions.invoke('sync/changes?...')`）。

> Edge Function 透過 `SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 環境變數連線；這兩個在 Supabase 託管環境會自動注入，不需手動設定。

## 5. 設定前端環境變數

```bash
cp apps/web/.env.example apps/web/.env
```

編輯 `apps/web/.env` 填入步驟 1 取得的值：

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

重新啟動開發伺服器讓變數生效：

```bash
npm run dev
```

> 部署到 GitHub Pages 等靜態主機時，這兩個變數要在建置環境（CI secrets / build env）提供，因為 Vite 會在 `npm run build` 時把它們編譯進前端產物。

## 6. 煙霧測試（跨裝置同步）

1. 用兩個瀏覽器（或兩台裝置）登入同一個帳號 / 同一個 household。
2. 裝置 A：新增一個物品、新增/編輯一個位置。
3. 觸發同步（`pushOutbox` 上傳、`pullChanges` 下載）。
4. 裝置 B：拉取後應看到 A 新增的物品與位置，且欄位（名稱、分類、位置路徑等）正確、無假性衝突。

### 預期行為

- 物品、位置、標籤、歷史會同步；**照片本體不會**（僅 metadata）。
- 同時編輯同一筆資料時，伺服器以 `base_version` 比對；版本不符的 op 會回報 `version_conflict`，並進入本地衝突佇列（`apps/web/src/sync/conflicts.ts`）。
- 非 admin 成員送出刪除/還原/成員管理類操作會被伺服器以 `admin_required` 擋下。

## 疑難排解

- **`pushOutbox` 回報「尚未設定 Supabase。」**：`.env` 沒填或開發伺服器未重啟。
- **403 Forbidden**：登入帳號不是該 household 的 active 成員（檢查 `household_members`）。
- **拉取後資料形狀怪異**：確認 Edge Function 是最新版（重新 `supabase functions deploy sync`）；camel/snake 轉換在 `functions/_shared/mapping.ts`。
