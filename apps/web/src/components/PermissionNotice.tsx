interface PermissionNoticeProps { message?: string; }
export function PermissionNotice({ message = '你沒有執行此操作的權限。' }: PermissionNoticeProps) { return <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{message}</div>; }
