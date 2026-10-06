# Implementation Plan: 雙登入

## Approach

1. 沿用 React、Supabase SDK、共用 Button 與既有登入卡片；Google 按鈕置於 Email 表單之外。
2. 共用 Supabase client 設定 PKCE、detectSessionInUrl；建立 client 前捕捉 callback 狀態，AuthProvider 等 SDK initialize 與 getSession 完成，再清理授權參數。不另呼叫 exchangeCodeForSession。
3. AuthContext 增加 loginError；初始化及回跳錯誤使用固定中文訊息，不顯示 provider 原始錯誤或 token。Email 註冊明確指定 BASE_URL 根入口驗證回跳。
4. 家庭 provider 依 user.id keyed remount；載入 households 與該 user 的 active memberships，完整取得後才放行 App。Dexie transaction 覆寫此 user 的 membership，保留其他帳號與物品。
5. 新家庭 RPC 後查詢真實 membership；家庭載入錯誤提供重試／登出，選擇家庭只接受已授權且載入的家庭。
6. 不呼叫外部控制台、不使用真實登入帳號；在部署文件列 Google provider／精確 redirect 設定與真實 UAT。

## Validation

Vitest + Testing Library 驗證 SDK 初始化／失敗、雙入口、防重入、Email 驗證回跳、callback 清理、角色更新、非 active membership、過期請求與切換隔離。執行根 scripts；本機畫面 smoke 與真實 OAuth UAT 分開紀錄。

## Compatibility

跨裝置 PKCE 缺少 verifier 可無 session，但信箱確認後使用密碼登入；舊 implicit 驗證連結顯示相同指引。純離線 mode 不要求登入。原 005 實機待辦保留，不視為本 feature 完成。
