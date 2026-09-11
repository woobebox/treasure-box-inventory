# Implementation Plan: 收納流程與 UI 維護優化

**Feature**: `005-inventory-flow-optimization` | **Date**: 2026-09-09

## Technical Context

React 19、TypeScript、Vite、Tailwind、Dexie、Lucide。沿用手寫 History API router、現有 `item.update` Edge Function contract 與 48px 共用控制。

## Decisions

1. 新增 `updateItemDetails` domain action，以 transaction 更新 item、itemTags、history、syncOps；不新增 schema。
2. 詳情頁使用 inline edit section，編輯時保留原值；成功後重載詳情。
3. 新增頁以 submitter value 區分「儲存並查看」與「儲存並繼續」；後者保留位置、分類。
4. 草稿使用 sessionStorage，key 由 household/user 組成，只保存可序列化文字欄位。`visibilitychange` 與 state 變更皆更新；照片明確排除。
5. App 內部導覽透過 cancelable navigation request event；表單攔截並以 ConfirmDialog 決定是否續行。外部關頁沿用 beforeunload。
6. 搜尋排序在 service 最後階段執行，URL 新增 `sort`、`view`；精簡模式沿用 ItemCard 資料，不新增另一套 query。
7. CSS token 補齊 primary hover/on-primary/danger 等；共用控制改讀 token。新增的 page/form primitives 先套用到 005 變更頁面，避免全面重構。
8. 元件預覽只在 `import.meta.env.DEV` 的 `/ui-preview` 渲染，不出現在正式導覽。

## Risk Controls

- tag 更新與 item 更新必須同 transaction，失敗不得留下半套資料。
- sync baseVersion 使用更新前 version。
- 草稿不跨家庭、不含照片，完成／捨棄即清除。
- 排序不改原有篩選語意，預設仍為最近更新。

## Verification

新增 domain、draft、搜尋 URL/排序、連續新增與編輯 UI 測試；再執行 typecheck、lint、test、build、diff check，並用三個既定 viewport 做瀏覽器 smoke test。
