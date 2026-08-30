import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ConfirmDialog } from '../components/ui';
import { ToastProvider } from '../components/toast/ToastProvider';
import { useToast } from '../components/toast/toastContext';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)}>開啟刪除</button><ConfirmDialog open={open} title="刪除物品？" description="刪除後可還原。" onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)} /></>;
}

function ToastHarness() {
  const { show } = useToast();
  return <button type="button" onClick={() => show('儲存完成')}>顯示通知</button>;
}

describe('feedback primitives', () => {
  it('traps dialog focus, supports Escape, and restores the trigger focus', async () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: '開啟刪除' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: '刪除物品？' })).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: '取消' })).toHaveFocus());

    const confirm = screen.getByRole('button', { name: '確認' });
    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: '取消' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('announces toast content and exposes a separate close control', () => {
    render(<ToastProvider><ToastHarness /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: '顯示通知' }));
    expect(screen.getByRole('status')).toHaveTextContent('儲存完成');
    fireEvent.click(screen.getByRole('button', { name: '關閉通知' }));
    expect(screen.queryByText('儲存完成')).not.toBeInTheDocument();
  });
});
