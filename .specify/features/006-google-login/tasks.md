# Tasks: Google＋Email／密碼雙登入

- [x] T001 建立 spec → plan → tasks 並保留既有未提交內容
- [x] T002 PKCE client、根入口回跳、初始化／錯誤／URL 清理
- [x] T003 雙入口、共用 busy lock、Email 驗證相容
- [x] T004 帳號家庭隔離、真實 membership、載入失敗重試
- [x] T005 新增登入／callback／角色／帳號切換回歸測試
- [x] T006 執行 typecheck、lint、test、build、diff check
- [x] T007 更新部署說明、quickstart 與 session 紀錄
- [x] T008 本機手機／平板登入畫面 smoke
- [ ] T009 外部控制台設定與真實 OAuth／Email／雙裝置 UAT（需設定環境與測試帳號；前端 commit／push／自動更新已於 2026-10-06 另獲授權）

2026-10-06：35 test files／100 tests 全過；typecheck、lint（0 warnings）、build、diff check 通過。375×812、768×1024、1024×768 無水平 overflow；登入／註冊雙入口、鍵盤 Google → Email、拒絕授權與缺 verifier 的中文指引／URL 清理已以虛構 Supabase 設定驗收。真實 Google、Email 郵件確認、同信箱 user.id 銜接與 PWA／雙裝置 UAT 尚未執行，T009 保持未勾。
