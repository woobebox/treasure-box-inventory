# Feature Specification: 收納流程與 UI 維護優化

**Feature**: `005-inventory-flow-optimization` | **Date**: 2026-09-09 | **Status**: In progress

## Scope

延續既有明亮 teal、手機底部導覽、平板 rail 與 1024px shell，補齊物品基本資料編輯、同位置連續新增、文字草稿恢復、站內離開保護、搜尋排序與結果密度，並讓共用控制更完整地使用語意樣式。保留 IndexedDB schema、Supabase schema、權限、既有 pathname 與同步協定。

## User Stories

### US1 - 修改物品資料（P1）

使用者可在詳情頁修改名稱、分類、備註與標籤。儲存必須建立 `item.updated` 歷史及 `item.update` 待同步操作；取消不得寫入。

### US2 - 同一位置連續新增（P1）

新增成功後，使用者可選擇查看新物品，或保留位置與分類繼續新增。下一筆必須清除名稱、備註、標籤與照片。

### US3 - 避免未儲存內容遺失（P1）

表單文字草稿依家庭與使用者隔離，重新整理後可恢復。站內導覽時顯示共用確認視窗；確認捨棄才離開。草稿不保存照片，成功儲存或捨棄後清除。

### US4 - 更快找到物品（P2）

搜尋結果支援最近更新、最近建立及名稱排序，並可切換卡片／精簡清單；排序與顯示方式保留於 URL，返回後仍一致。首頁將快速操作置於家庭摘要前。

### US5 - 後續 UI 易於一致調整（P2）

共用控制使用語意色彩 token，新增 `PageHeader`、`SectionCard`、`FormField`、`StatusBadge`，並提供只在開發環境顯示的元件預覽路由。

## Functional Requirements

- FR-001：物品更新 MUST 驗證家庭範圍、名稱、分類及標籤長度，並以單一 Dexie transaction 寫入 item、tag links、history、sync op。
- FR-002：更新 sync payload MUST 包含 `item`、`tagNames`、`historyEntry`，沿用後端 `item.update`。
- FR-003：連續新增 MUST 只保留位置與分類，不得沿用照片或前一筆識別資料。
- FR-004：草稿 key MUST 含 householdId 與 userId；MUST NOT 序列化 Blob／照片。
- FR-005：站內導覽攔截 MUST 使用共用 ConfirmDialog，並可取消或確認捨棄。
- FR-006：搜尋排序 MUST deterministic；相同值以 id 作穩定排序。
- FR-007：排序與 view MUST 經 URL parse/serialize round trip，且預設值不輸出。
- FR-008：所有新增共用控制 MUST 保持可見 label、48px touch target、focus-visible、busy/disabled 與 reduced-motion。
- FR-009：既有色調、資料模型、權限與公開主導覽 MUST 保持相容。

## Success Criteria

- SC-001：物品更新後本機 item、標籤、history 與 pending sync op 一致。
- SC-002：同位置連續新增三件時不必重選位置，且照片不會跨筆殘留。
- SC-003：重新整理可恢復文字草稿；換家庭／使用者不會讀到另一份草稿。
- SC-004：搜尋排序與顯示方式返回後保留，375px 不產生水平捲動；1366px 寬平板可使用擴展內容區，不被 1024px 外框限制。
- SC-005：typecheck、lint、完整測試、build、diff check 通過。

## Out of Scope

- 分類改為選填、照片草稿持久化、批次移動、QR、數量／借出資料模型。
- 全 App 深色模式、外部字型、第三方 UI library、伺服器搜尋、IndexedDB migration。
