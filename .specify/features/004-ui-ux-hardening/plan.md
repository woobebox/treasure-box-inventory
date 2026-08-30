# Implementation Plan: 全 App UI／UX 完成度強化

**Feature**: `004-ui-ux-hardening` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

## Summary

在不改業務資料模型的前提下，先建立共用非同步狀態與 ConfirmDialog，再修正 AppShell focus／scroll contract、搜尋 URL 狀態與競態、首頁同步摘要及 768px 密度；最後將一致的確認、表單標籤、Toast、位置樹和設定資訊層級套用全 App。

## Technical Context

**Stack**: React 19、TypeScript、Vite、Tailwind CSS、Lucide、Dexie
**Routing**: 既有 pathname 手寫路由，不引入 router 依賴
**Storage**: 既有 IndexedDB / Supabase，不新增 schema
**Testing**: Vitest、Testing Library、jsdom、fake-indexeddb，搭配本機瀏覽器視覺驗收
**Performance**: 輸入回饋 <100ms；搜尋 debounce 250ms；不加入新 runtime dependency
**Accessibility**: WCAG 2.2 AA、44–48px touch targets、route focus、dialog focus management、200% text zoom
**Constraints**: 375／768／1024 響應式合約、1024px shell、明亮 teal、繁體中文、離線優先

## Constitution Check

- ✅ Spec-first：`spec.md`、`plan.md`、`tasks.md` 完成後才修改 runtime。
- ✅ 最小變更：只處理分析確認的 UI／UX 缺口，不改 domain contract。
- ✅ 離線優先：所有 loading／search／sync presentation 仍使用本機資料與現有 scheduler。
- ✅ 可驗證：每個 P1 流程新增 Testing Library 回歸測試與三 viewport 驗收。
- ✅ 安全操作：刪除與移除採一致確認、busy 防重複與錯誤恢復。

## Design Decisions

### D1. Async state primitive

擴充 `StatusState` 為 `LoadingState`、`EmptyState`、`ErrorState`，loading 使用固定高度 skeleton，避免 CLS。頁面使用明確 `loading` flag，不以 `data.length === 0` 推測載入完成。

### D2. Search state contract

搜尋 filter 以純函式序列化到 query string；文字輸入使用 250ms debounce。每次搜尋取得遞增 request id，只允許最新 id 更新結果。App 在離開路由前寫入目前 `scrollY` 至 `history.state`；搜尋結果完成後恢復 popstate 的 scroll。

### D3. Route focus contract

加入可見於 focus 的 skip link。AppShell 的 `<main>` 具有 `id`、`tabIndex=-1` 與 ref；path 改變後聚焦 main。header 顯示既有 `pageCopy.description`，平板可見、手機保持緊湊。

### D4. Dialog primitive

新增 `ConfirmDialog`：portal 非必要，維持 App root 內渲染；開啟時記住 activeElement、聚焦取消按鈕、以 keydown 實作 Escape／Tab loop，關閉或 unmount 時還原焦點。所有危險操作透過明確 state 開啟 dialog，async handler 決定何時關閉。

### D5. Responsive density

首頁 quick actions 使用 `md:grid-cols-2 min-[960px]:grid-cols-3`。位置 tree 以可收合 row 呈現，縮排使用受限 depth indicator，不再每層疊完整卡片。成員列在手機垂直堆疊，平板才橫向。

### D6. Feedback and contrast

Toast 由整顆 button 改為 status／alert 容器加獨立 close IconButton；success/info 維持合理自動關閉，error 停留較久。將必要的 `slate-400/500`、`amber-600` 小字提升至合格色值，focus ring 使用 semantic token。

### D7. Runtime-only sync timestamp

`SyncSchedulerState` 增加 `lastCompletedAt: string | null`，只在成功或失敗完成時更新；不寫 DB、不進 sync payload。首頁顯示 locale 時間及 scheduler message。

## File Impact

```text
apps/web/src/
├── app/App.tsx                           # focus、scroll、page description
├── components/StatusState.tsx            # loading/error/empty primitives
├── components/ui/ConfirmDialog.tsx       # accessible confirmation primitive
├── components/toast/ToastProvider.tsx    # live region + close control
├── features/home/HomePage.tsx            # async state、sync result、768 density
├── features/search/                      # URL state、debounce、race、a11y
├── features/locations/                   # progressive form、collapsible tree、dialog
├── features/items/                       # loading、form focus、photo/delete dialog
├── features/auth/LoginPage.tsx           # autocomplete、password toggle、message tone
├── features/households/                  # landmark、labels、responsive member actions
├── features/settings/                    # contrast、busy、confirm consistency
├── sync/syncScheduler.ts                 # runtime lastCompletedAt
├── styles/global.css                     # skip link、tokens、contrast、skeleton
└── test/                                 # async/search/focus/dialog regressions
```

## Implementation Sequence

1. 共用狀態、ConfirmDialog、Toast 與 token。
2. AppShell focus、skip link、scroll snapshot。
3. 首頁、搜尋與主要資料頁 loading/error/empty。
4. 破壞性操作與表單 accessibility。
5. 位置、成員、設定的 responsive density。
6. 測試、build、三 viewport、鍵盤與縮放驗收。

## Risk Controls

- URL query 只承載搜尋 UI 狀態，不改公開 pathname 或 deep-link contract。
- `lastCompletedAt` 只屬 scheduler 記憶體 state，不接觸 DB／Supabase。
- ConfirmDialog 不變更底層刪除 repository；只包裝 UI 前置確認。
- 未儲存表單保護若會干擾站內手寫路由，先以 `beforeunload` 與成功 reset 的最小範圍實作，不攔截既有 route handler。
