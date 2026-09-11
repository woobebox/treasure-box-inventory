import { AlertTriangle, Check, Plus } from 'lucide-react';
import { Button, FormField, PageHeader, SectionCard, StatusBadge } from '../../components/ui';

export function UiPreviewPage() {
  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader eyebrow="開發工具" title="介面元件預覽" description="集中比較常用控制與狀態。此頁只在開發環境提供，不連接家庭資料。" />
    <SectionCard className="space-y-4" aria-labelledby="preview-buttons">
      <h3 id="preview-buttons" className="text-lg font-bold text-[var(--ui-text)]">按鈕與狀態</h3>
      <div className="flex flex-wrap gap-3">
        <Button leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />}>主要操作</Button>
        <Button variant="secondary">次要操作</Button>
        <Button variant="ghost">文字操作</Button>
        <Button variant="danger">危險操作</Button>
        <Button busy>處理中</Button>
        <Button disabled>無法操作</Button>
      </div>
      <div className="flex flex-wrap gap-2"><StatusBadge>一般</StatusBadge><StatusBadge tone="success"><Check aria-hidden="true" className="mr-1 h-3.5 w-3.5" />完成</StatusBadge><StatusBadge tone="warning"><AlertTriangle aria-hidden="true" className="mr-1 h-3.5 w-3.5" />待處理</StatusBadge><StatusBadge tone="danger">錯誤</StatusBadge></div>
    </SectionCard>
    <SectionCard className="grid gap-4 md:grid-cols-2" aria-labelledby="preview-fields">
      <h3 id="preview-fields" className="md:col-span-2 text-lg font-bold text-[var(--ui-text)]">表單欄位</h3>
      <FormField id="preview-name" label="物品名稱" required hint="最多 120 字"><input id="preview-name" className="field-control mt-1 w-full" defaultValue="旅行收納袋" /></FormField>
      <FormField id="preview-error" label="位置" required error="請選擇位置"><select id="preview-error" aria-invalid="true" aria-describedby="preview-error-error" className="field-control mt-1 w-full"><option>選擇位置</option></select></FormField>
    </SectionCard>
  </div>;
}
