# Data Model: 全 App UI／UX 完成度強化

**Feature**: `004-ui-ux-hardening` | **Date**: 2026-08-27

## Persistent Data

不新增 IndexedDB table／field，不 bump schema，不新增 Supabase migration，不改 RLS、Edge Function 或 sync payload。

## Runtime State

### AsyncViewState

```ts
type AsyncViewState = 'loading' | 'success' | 'error';
```

頁面以明確 state 搭配既有資料，`success + data.length === 0` 才代表 empty。

### SyncSchedulerState addition

```ts
lastCompletedAt: string | null;
```

只存在 module singleton 記憶體；成功或失敗完成時更新，configure/stop reset，不持久化。

### Search URL state

允許的 query keys：`q`、`category`、`location`、`status`、`tag`、`from`、`to`。空值與 `status=all` 不輸出；解析時只接受既有 `ItemStatus` 值。

### ConfirmDialogProps

```ts
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Dialog 不持有 domain mutation，只處理 UI focus 與確認事件。

### ToastItem

維持 `id`、`message`、`variant`，新增依 variant 決定 timeout；error 可較久，所有 toast 具獨立 close accessible name。
