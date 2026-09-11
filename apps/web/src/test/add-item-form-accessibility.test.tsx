import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { createLocation } from '../db/locationRepository';
import { requestAppNavigation } from '../app/navigationRequest';

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-form', userId: 'u1', deviceId: 'd1' }),
}));
vi.mock('../components/toast/toastContext', () => ({ useToast: () => ({ show: vi.fn() }) }));

const { AddItemPage } = await import('../features/items/AddItemPage');

describe('add item form accessibility', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/add');
  });

  it('focuses the first invalid field and associates its error message', async () => {
    render(<AddItemPage />);
    const submit = screen.getByRole('button', { name: '儲存並查看' });
    fireEvent.submit(submit.closest('form')!);

    const name = screen.getByLabelText(/物品名稱/);
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'item-name-error');
    expect(screen.getByText('請輸入物品名稱')).toHaveAttribute('role', 'alert');
  });

  it('keeps category and location when saving and continuing', async () => {
    const location = await createLocation({ householdId: 'hh-form', name: '旅行箱', type: 'box' });
    render(<AddItemPage />);
    fireEvent.change(screen.getByLabelText(/物品名稱/), { target: { value: '充電器' } });
    await waitFor(() => expect(screen.getByLabelText(/^位置/)).toHaveTextContent('旅行箱'));
    fireEvent.change(screen.getByLabelText(/^分類/), { target: { value: '工具' } });
    fireEvent.change(screen.getByLabelText(/^位置/), { target: { value: location.id } });
    fireEvent.click(screen.getByRole('button', { name: '儲存並繼續新增' }));
    await waitFor(() => expect(screen.getByLabelText(/物品名稱/)).toHaveValue(''));
    expect(screen.getByLabelText(/^分類/)).toHaveValue('工具');
    expect(screen.getByLabelText(/^位置/)).toHaveValue(location.id);
    expect(await db.items.where('householdId').equals('hh-form').count()).toBe(1);
  });

  it('blocks internal navigation until the user discards the draft', async () => {
    render(<AddItemPage />);
    fireEvent.change(screen.getByLabelText(/物品名稱/), { target: { value: '尚未完成' } });
    let resumed = false;
    act(() => requestAppNavigation(() => { resumed = true; }));
    expect(screen.getByRole('dialog', { name: '捨棄尚未儲存的內容？' })).toBeInTheDocument();
    expect(resumed).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(resumed).toBe(false);
  });
});
