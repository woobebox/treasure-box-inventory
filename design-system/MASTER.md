# Treasure Box Inventory Design System

本文件是 UI 調整的主規則。頁面若未另有 `design-system/pages/<page>.md`，以此文件為準。

## Product direction

- 家庭收納 productivity PWA，優先支援手機拍照／輸入與平板查閱。
- 視覺保持明亮、柔和、可信任；主色 teal，系統字型，不載入外部字型。
- 不加入虛構智慧家居資訊；所有摘要必須來自現有庫存資料。

## Responsive contract

- 375px：手機底部五項導覽，內容保留 safe-area padding，核心操作優先。
- 768px：切換左側 rail，內容常用兩欄。
- 1024px：shell 封頂，首頁快速操作三欄。
- 所有斷點不得水平捲動；必要文字允許換行，不以截斷取代可讀性。

## Semantic tokens

定義於 `apps/web/src/styles/global.css` 的 `--ui-*`：background、surface、text、muted text、border、primary、primary hover、primary soft、success、warning、danger、focus、card radius、card shadow。共用元件不得新增相同用途的 raw hex／Tailwind palette；新狀態先補 token。

## Components

- `Button`／`ActionLink`：primary、secondary、ghost、danger；48px 以上，busy 必須 disabled 並公告狀態。
- `IconButton`：圖示可小於 24px，但 hit area 固定 48px，必須有 accessible name。
- `PageHeader`：eyebrow、單一頁面標題與可選描述。
- `SectionCard`：一般頁面區塊 surface。
- `FormField`：可見 label、必填、hint／error 關係；複雜 picker 可維持專用元件。
- `StatusBadge`：狀態必須同時有文字；不能只靠顏色。
- `ConfirmDialog`：破壞性與捨棄未儲存內容使用，保留 focus trap、Escape 與焦點還原。

## Interaction

- 操作在 100ms 內有 pressed／loading 回饋；一般 transition 150–300ms。
- 每頁維持一個主要 CTA；同級次要操作使用 secondary／ghost。
- 表單錯誤顯示在欄位旁，提交失敗聚焦第一個錯誤。
- 輸入草稿依家庭與使用者隔離；不得將照片 Blob 放入 sessionStorage。
- `prefers-reduced-motion` 時將動畫與 transition 縮至 1ms。

## Preview and acceptance

開發模式使用 `/ui-preview` 比較共用元件。交付前固定驗收 375×812、768×1024、1024×768，並檢查鍵盤、200% zoom、reduced-motion、長文字、空資料、錯誤與 dialog。
