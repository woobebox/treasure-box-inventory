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

## 6. Google＋Email／密碼登入設定

Email／密碼登入及開放註冊保留。新增 Google 登入使用 Supabase SDK PKCE，同一分頁跳轉，回跳至 App 根入口。Google 新帳號沒有預設密碼；本版不提供設定密碼或跨信箱手動綁定。

### Google Auth Platform

1. 建立或選擇 Google Cloud 專案，設定應用程式名稱、聯絡信箱、隱私權政策及 Audience。測試階段將實際驗收帳號加入 Test users；對外開放前依 Google 控制台要求完成發布／品牌驗證。
2. Data Access 僅設定 `openid`、`userinfo.email`、`userinfo.profile`，不要求 Gmail、Drive 或其他資料權限。
3. 建立 Web application OAuth client。Authorized JavaScript origins 填 `https://woobebox.github.io`；需要本機驗收時另列 `http://localhost:5173`。
4. Authorized redirect URIs 使用 **Supabase → Authentication → Sign In / Providers → Google** 顯示的 callback URL（通常為 `https://<project-ref>.supabase.co/auth/v1/callback`）。這裡不是 GitHub Pages 網址；使用自訂 Supabase 網域時也以 provider 頁面實值為準。
5. 在 Supabase Google provider 啟用 Google，填入 Client ID／Client Secret。Secret 僅留在 provider 設定；不得放入 `VITE_*`、GitHub 前端建置變數或版本庫。不要停用 nonce、JWT 或 RLS 檢查。

### Supabase URL Configuration

| 設定 | 完整網址 |
|------|----------|
| Site URL | `https://woobebox.github.io/treasure-box-inventory/` |
| 正式 Redirect URL | `https://woobebox.github.io/treasure-box-inventory/` |
| 本機 Redirect URL（僅測試需要時） | `http://localhost:5173/` |

正式 allowlist 使用精確網址，不以 `**` 開放任意回跳。若本機改用 `127.0.0.1` 或不同 port，需另列該次完整入口網址；不要混用 origin。前端以 `window.location.origin`＋`BASE_URL` 組合 Google `redirectTo` 與 Email `emailRedirectTo`，不接受 URL 中提供的任意目的地。

PKCE 授權碼由 SDK 自動交換，前端不另呼叫 `exchangeCodeForSession`。Google 流程需在原瀏覽器完成；缺少 verifier、授權碼過期／重用、拒絕授權時會清理 callback 參數並提供中文重試訊息。Email 在其他裝置完成驗證但未取得 session 時，使用原 Email／密碼登入即可，無需重新註冊；舊 implicit 驗證連結也可能需要重新用密碼登入。

### 帳號銜接與真實驗收

- 已驗證 Email 帳號使用相同信箱 Google 登入：由 Supabase 自動 identity linking，必須確認原 `user.id`、家庭、物品與角色不變。不要在前端以 email 自行改寫 user_id 或複製家庭。
- 不同信箱：不同帳號；不得看到另一帳號家庭或被自動加入家庭。Google 新帳號無家庭時進入既有建立家庭流程。
- 先 Google 註冊的帳號不會因此具備密碼；相同信箱再次按 Email 註冊不能視為成功建立密碼，應使用 Google 入口。
- admin／member 權限必須以 `household_members` 的真實 active membership 驗收；切換帳號、登出及重新整理皆不可沿用舊家庭。家庭讀取失敗應能重試／登出。
- 分別驗收 Email 密碼登入、同瀏覽器及跨裝置 Email 驗證、Google 成功／取消、相同信箱銜接、不同信箱隔離、手機及平板；瀏覽器 console／應用程式日誌不得記錄授權碼、token 或原始 provider 錯誤。

本機測試僅證明程式行為。Google／Supabase 控制台設定、實際同帳號銜接及裝置 UAT 需另附環境與結果，未通過前不得宣告 Google 登入已可使用。前端發布不會自動完成 Google provider 或回跳設定；本次未執行控制台修改。

官方文件：[Google 登入](https://supabase.com/docs/guides/auth/social-login/auth-google)、[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)、[Identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)、[Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)。

## 7. 煙霧測試（跨裝置同步）

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
