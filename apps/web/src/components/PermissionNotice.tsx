interface PermissionNoticeProps { message?: string; }
export function PermissionNotice({ message = '你沒有執行此操作的權限。' }: PermissionNoticeProps) { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-900" role="alert">{message}</div>; }
