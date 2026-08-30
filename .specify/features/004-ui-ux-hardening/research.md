# Research: 全 App UI／UX 完成度強化

**Feature**: `004-ui-ux-hardening` | **Date**: 2026-08-27

## R1. 視覺方向

**Decision**: 延續 003 的明亮 teal、系統字型、柔和卡片與 1024px shell。

**Rationale**: 使用者已肯定目前方向；本輪目標是產品完成度而非重塑品牌。UI/UX design-system 搜尋提出 dark operations、外部 Fira 字型與 exaggerated minimalism，但與既有離線 PWA、家庭使用情境及鎖定風格衝突，因此不採用。

## R2. 非同步狀態

**Decision**: 每頁使用 explicit loading/error flag，不能用空陣列或 null 同時代表「尚未載入」與「沒有資料」。

**Rationale**: 首頁、搜尋、位置、詳情與回收桶目前可能在 repository Promise 完成前誤顯 empty/not-found，降低資料可信度。

## R3. 搜尋效能與連續性

**Decision**: 250ms debounce + monotonic request id；filter query 使用 URLSearchParams；popstate 後依 history scroll snapshot 恢復。

**Rationale**: 不引入 router 或搜尋索引 migration，也能避免每次按鍵全表掃描、Promise 競態及返回失去條件。

## R4. 對話框

**Decision**: 以內部 ConfirmDialog 統一危險操作；使用原生 button、role=dialog、aria-modal、aria-labelledby、keydown focus loop。

**Rationale**: `window.confirm` 與自製 modal 並存，且既有 modal 沒有完整 focus lifecycle。第三方 dialog library 會增加依賴，不符合最小變更。

## R5. 位置樹密度

**Decision**: 節點改為單層 surface 內的 recursive rows，子節點預設展開但可收合；每層縮排限制為 12px 並保留層級線。

**Rationale**: 每層完整圓角卡片加 16px margin 會在深層位置造成視覺與水平空間浪費。

## R6. 表單草稿保護

**Decision**: 本批只加入 `beforeunload` 防止重新整理／關閉造成資料遺失；不建立 IndexedDB draft model，也不全面攔截站內導航。

**Rationale**: 完整站內離開攔截需要改動手寫 router contract；新持久化 draft 會超出 UI hardening 邊界。

## R7. 對比與字級

**Decision**: 必要說明文字不低於 12px，淺背景小字使用 `slate-600`／語意 token；amber 狀態改用較深色或增加圖示與文字。

**Rationale**: 現有 `slate-400` 與 `amber-600` 在淺背景的小字組合無法穩定達到 4.5:1。
