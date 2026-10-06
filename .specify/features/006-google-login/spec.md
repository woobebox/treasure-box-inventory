# Feature Specification: Google＋Email／密碼雙登入

**Feature**: `006-google-login` | **Date**: 2026-10-06 | **Status**: Implemented locally; external UAT pending

## User Stories

- US1：使用者可在登入與註冊畫面選擇 Google，或沿用 Email／密碼；Google 不依賴表單欄位。
- US2：已驗證的相同信箱由 Supabase 銜接至原帳號，家庭與 user.id 維持一致；不同信箱不自動合併。
- US3：登出或切換帳號不會顯示前一帳號家庭；家庭角色必須來自雲端 membership。

## Requirements

- FR-001：維持開放註冊、Email 驗證、離線模式與既有導覽；Google 新帳號不新增設定密碼功能。
- FR-002：Google 使用 Supabase OAuth PKCE、同分頁跳轉、BASE_URL 根入口回跳；SDK 僅交換一次授權碼。
- FR-003：初始化期間阻擋 App；成功及失敗均清除授權參數，錯誤以安全中文訊息顯示，可重新嘗試。
- FR-004：跨裝置信箱驗證未建立 session 時提示 Email／密碼登入，不要求重新註冊。
- FR-005：操作中禁止 Google／Email 重複或交錯提交。
- FR-006：帳號切換立刻隔離家庭 state，過期請求不更新 state；雲端讀取失敗不得沿用舊家庭或永久 loading。
- FR-007：本機 membership 以雲端 active membership 原 id／role 覆寫；新家庭由 RPC 與 membership 查詢取得權限，不推定 admin。
- FR-008：不變更 schema、RLS、JWT、同步協定；Client Secret 不進入前端或版本庫。

## Success Criteria

- SC-001：雙入口、回跳錯誤與清理、帳號切換／角色回歸通過。
- SC-002：typecheck、lint、完整 test、build、diff check 通過。
- SC-003：真實 Google／Email 登入、相同 user.id、資料隔離與裝置驗收另記證據，未完成不得宣告上線。

## Exclusions

推送／部署、密碼設定／重設、跨信箱手動綁定、One Tap、資料庫 migration。
