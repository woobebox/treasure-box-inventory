# 006 雙登入驗收

## 本機自動驗證

在 repository 根目錄執行 `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`git diff --check`。

新增 auth client／redirect／session／login、household session 與 cloud membership 測試涵蓋：本機與 Pages 回跳、PKCE 設定與離線模式、授權參數清理、安全錯誤、防重複提交與瀏覽器 Back 恢復、既有 Email、缺 verifier／失效 code、StrictMode 單次初始化、過期家庭查詢、角色覆寫、家庭失敗重試及新家庭 membership。

2026-10-06 本機結果：35 files／100 tests、typecheck、lint（0 warnings）、build、diff check 通過；jsdom 僅有既有 `Window.scrollTo()` 未實作資訊。首次 typecheck 因測試查詢使用不支援的 `exact` 選項失敗，改用精確 name 字串後通過；首次 lint 的 effect ref cleanup 警告改用 effect 內捕捉的 generation 後清除。

## 本機畫面

執行 `npm run dev`。Supabase 有設定時才會顯示登入頁；未設定仍維持純離線模式。以 375×812、768×1024、1024×768 檢查雙入口、註冊切換、鍵盤可達與 overflow。測試 callback 錯誤時，不使用真實授權碼／token。

2026-10-06 已以虛構 `auth-smoke.invalid` Supabase 設定完成上述三 viewport smoke，無水平溢出；拒絕授權、缺 verifier 皆顯示安全中文指引並清除 URL，Google 按鈕可重試且 Tab 進入 Email 欄位；檢查 console 無 error／warning。未提交任何登入表單。測試伺服器最初 `listen EPERM 127.0.0.1:5178`，核准本機監聽後啟動成功；舊錯誤分頁 reload 的 data URL 受工具政策阻擋，改開已就緒的原始 HTTP 網址完成檢查，未繞過安全 interstitial。

## 外部 UAT（尚待完成）

先完成 `docs/supabase-deploy.md` 第 6 節。記錄測試日期／環境及結果，帳號／user.id 的證據不放入公開文件。

1. 既有 Email 帳號可登入、登出與重新整理；信箱驗證同瀏覽器成功，跨裝置至少能確認信箱後用密碼登入。
2. 同信箱 Google 登入維持原 user.id、家庭、物品與 member／admin 權限；不同信箱沒有相同權限。
3. Google 新帳號進入建立家庭；不宣稱其已具備密碼登入能力。
4. Google 取消／拒絕授權後可再次登入；確認 callback URL 不留授權參數。
5. 同瀏覽器切換 A／B 帳號不出現前帳號家庭，兩台裝置各自用兩種登入方式可讀取同一已授權家庭。
6. 正式 Pages 子路徑、手機、平板、PWA 安裝模式分別驗收；PWA 若開啟不同瀏覽器上下文缺 verifier，應顯示重試指引，不宣告已建立 session。

未修改 schema、RLS 或同步協定；原 005 zoom／reduced-motion／同步驗收未因此完成。
