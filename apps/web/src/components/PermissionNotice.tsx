interface PermissionNoticeProps { message?: string; }
export function PermissionNotice({ message = 'You do not have permission to perform this action.' }: PermissionNoticeProps) { return <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{message}</div>; }
