# Feature Specification: 全 App UI／UX 完成度強化

**Feature Branch**: `004-ui-ux-hardening`
**Created**: 2026-08-27
**Status**: Implemented — local visual smoke test pending
**Language**: zh-TW

## Scope

本功能延續 `003-tablet-smart-home-ui` 的 1024px 響應式殼層、明亮柔和 teal 視覺與共用控制元件，補齊真實使用時的載入、錯誤、返回狀態、鍵盤焦點、危險操作與中尺寸平板密度。所有改動限於前端呈現與執行期互動，不新增智慧家居假資料，也不改資料庫、同步 payload、權限或公開路由。

## User Scenarios & Testing

### User Story 1 - 資料載入時不被誤導（Priority: P1）

使用者開啟首頁、搜尋、位置、詳情或回收桶時，必須先看到可辨識的載入狀態；只有資料確實載入完成後，才可以顯示零筆、找不到或空狀態。

**Independent Test**: 人為延遲 repository Promise，確認載入期間顯示 skeleton／loading，完成後正確切換為 data、empty 或 error，且 error 提供重試。

**Acceptance Scenarios**:

1. **Given** 本機資料尚在讀取，**When** 頁面首次顯示，**Then** 不得短暫顯示 0 筆或找不到資料。
2. **Given** repository 讀取失敗，**When** 使用者看到錯誤狀態，**Then** 可讀到原因並執行重試。
3. **Given** 讀取成功且資料確實為空，**When** empty state 顯示，**Then** 提供與頁面目標相關的下一步操作。

### User Story 2 - 搜尋後查看詳情再返回仍保留脈絡（Priority: P1）

使用者設定關鍵字、分類或進階篩選後進入物品詳情，再返回搜尋頁時，原篩選、結果與合理的捲動位置應保留；快速輸入時不能由過期搜尋結果覆蓋新結果。

**Independent Test**: 輸入關鍵字與進階條件、開啟結果、返回，確認 URL／控制狀態恢復；以不同延遲完成兩次搜尋，確認只採用最新結果。

**Acceptance Scenarios**:

1. **Given** 使用者連續輸入搜尋字詞，**When** 每次輸入觸發篩選，**Then** 搜尋以 200–300ms debounce 執行且有處理中回饋。
2. **Given** 舊搜尋比新搜尋晚完成，**When** Promise 回傳，**Then** 舊結果不得覆蓋新結果。
3. **Given** 使用者從搜尋結果進入詳情，**When** 返回搜尋，**Then** 關鍵字、篩選與結果捲動脈絡保留。
4. **Given** 搜尋沒有結果，**When** 存在任一篩選，**Then** 顯示可直接清除全部篩選的操作。

### User Story 3 - 鍵盤與輔助技術可完成導覽與確認（Priority: P1）

使用鍵盤或螢幕閱讀器的使用者可以跳至主要內容；路由切換後焦點移至新內容；所有確認視窗可用 Tab、Escape 操作，關閉後回到觸發控制。

**Independent Test**: 以鍵盤依序操作 skip link、主導覽、搜尋進階篩選及刪除確認，驗證 focus、expanded 狀態、dialog 名稱與焦點還原。

**Acceptance Scenarios**:

1. **Given** 使用者按下 Tab，**When** 進入 App，**Then** 第一個捷徑可跳至主要內容。
2. **Given** 使用者切換路由，**When** 新頁面顯示，**Then** 主內容獲得焦點且頁面標題可被理解。
3. **Given** 確認視窗開啟，**When** 使用 Tab 或 Shift+Tab，**Then** 焦點不離開視窗；Escape 可取消。
4. **Given** 視窗關閉，**When** 返回原頁，**Then** 焦點回到觸發按鈕。

### User Story 4 - 手機與 768px 平板保持舒適密度（Priority: P2）

使用者在 375px 手機、768px 直向平板與 1024px 橫向平板上，能閱讀快捷卡、照片控制、位置階層與成員資料，不會因多欄或過大控制而擁擠。

**Independent Test**: 在三個鎖定 viewport 與 200% 文字縮放檢查首頁、搜尋、位置、詳情和設定，確認無水平捲動、文字截斷或固定元素遮擋。

**Acceptance Scenarios**:

1. **Given** viewport 為 768×1024，**When** 查看首頁快捷操作，**Then** 使用兩欄節奏而非三張窄卡並排。
2. **Given** 位置有多層子節點，**When** 在手機查看，**Then** 可收合階層且不因每層完整卡片而過度縮窄。
3. **Given** 手機查看家庭成員，**When** ID 或狀態較長，**Then** 內容可換行且移除操作仍保持安全間距。
4. **Given** 文字放大至 200%，**When** 查看小字與控制，**Then** 主要內容仍可讀、可操作且對比達 WCAG AA。

### User Story 5 - 操作回饋一致且可恢復（Priority: P2）

使用者在刪除物品、照片、位置、選項或成員時看到一致的確認視窗與忙碌狀態；Toast 不搶焦點、可明確關閉，錯誤停留足夠時間。

**Independent Test**: 逐一觸發危險操作與成功／錯誤 Toast，確認共用 dialog、busy 防重複、可讀名稱、位置與關閉行為一致。

**Acceptance Scenarios**:

1. **Given** 使用者執行破壞性操作，**When** 點擊危險按鈕，**Then** 使用同一種 ConfirmDialog，不使用 `window.confirm`。
2. **Given** 操作正在執行，**When** 使用者再次點擊，**Then** 控制 disabled 並顯示 busy 狀態。
3. **Given** Toast 出現，**When** 使用螢幕閱讀器或鍵盤，**Then** 訊息被適當公告且有獨立的關閉按鈕。
4. **Given** App 使用平板 rail，**When** Toast 顯示，**Then** 位置不沿用手機底部導覽偏移。

### User Story 6 - 表單與設定資訊更容易完成（Priority: P3）

使用者提交表單遇到錯誤時能立即抵達第一個錯誤欄位；登入可使用系統自動填寫與顯示密碼；設定與家庭區塊具備正確標籤、landmark 與可掃讀分組。

**Independent Test**: 提交空白新增物品、切換登入模式、操作家庭成員及設定項目，確認可見 label、錯誤焦點、autocomplete、busy、確認與 landmark 正確。

## Functional Requirements

- **FR-001**: 所有主要 repository 驅動頁面 MUST 區分 loading、success-empty、success-data、error。
- **FR-002**: 錯誤狀態 MUST 說明原因並提供可執行的重試或修復路徑。
- **FR-003**: 搜尋 MUST 使用 200–300ms debounce 並忽略過期結果。
- **FR-004**: 搜尋條件 MUST 反映於目前 URL query，且使用瀏覽器返回時可恢復。
- **FR-005**: App MUST 提供 skip link；路由切換後 MUST 將焦點移至主要內容。
- **FR-006**: App MUST 在離開目前路由前保存合理的捲動位置；搜尋結果返回後 MUST 恢復其脈絡。
- **FR-007**: ConfirmDialog MUST 具備 dialog 名稱、focus trap、Escape 取消、初始焦點與關閉後焦點還原。
- **FR-008**: 破壞性 UI 操作 MUST 使用共用 ConfirmDialog、danger 樣式與 busy 防重複。
- **FR-009**: Toast MUST 使用合適 live-region，具有明確關閉控制；錯誤 Toast 不得只依賴短暫自動消失。
- **FR-010**: 首頁快速操作在 768px MUST 使用至少約 260px 的可讀 tile 寬度，直到足夠寬度才切三欄。
- **FR-011**: 搜尋進階控制 MUST 暴露 `aria-expanded` 與 `aria-controls`，結果數 MUST 可由輔助技術得知。
- **FR-012**: 表單欄位 MUST 有可見 label；提交失敗 MUST 聚焦第一個無效欄位並以語意關聯錯誤文字。
- **FR-013**: 登入欄位 MUST 支援 autocomplete 與密碼顯示切換；成功與錯誤回饋 MUST 視覺及語意區分。
- **FR-014**: 位置管理 MUST 使用漸進揭露的新建表單與可收合樹，深層節點不得產生水平捲動。
- **FR-015**: 家庭設定 MUST 避免巢狀 `main`；成員控制 MUST 有可見 labels、響應式排列與危險操作確認。
- **FR-016**: 小型一般文字與狀態文字 MUST 達 WCAG AA；不得使用 10px 低對比文字傳遞必要資訊。
- **FR-017**: 所有 clickable primitives MUST 有 pointer cursor、pressed、focus-visible、disabled 與 reduced-motion 相容狀態。
- **FR-018**: App MUST 顯示最近一次同步完成時間及最後結果文字，但不得新增持久化模型。
- **FR-019**: 本功能 MUST 保留 1024px shell、手機底部導覽、平板 rail、既有路由、IndexedDB、Supabase、同步 payload 與權限合約。

## Success Criteria

- **SC-001**: 延遲資料讀取測試中，0 個頁面在完成前誤顯空資料或 not-found。
- **SC-002**: 搜尋連續輸入只採用最後一次結果；從詳情返回後所有篩選值與 URL 一致。
- **SC-003**: 100% 共用 dialog 可用鍵盤完成取消／確認，並通過焦點鎖定及還原測試。
- **SC-004**: 375×812、768×1024、1024×768 皆無水平捲動或固定導覽遮擋；768px 快捷操作不出現過窄三欄。
- **SC-005**: 主要文字對比達 4.5:1；大圖示與大型文字至少 3:1。
- **SC-006**: `typecheck`、`lint`、完整 Vitest、build 與 `git diff --check` 全部成功。

## Out of Scope

- 深色模式、外部字型與第三方 UI library。
- 真實或虛構的燈光、溫度、能源及家電控制。
- IndexedDB schema、Supabase schema、同步 payload、權限與公開路由變更。
- 搜尋伺服器化、全文索引 migration 或大型資料虛擬清單。
