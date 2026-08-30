import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-form', userId: 'u1', deviceId: 'd1' }),
}));
vi.mock('../components/toast/toastContext', () => ({ useToast: () => ({ show: vi.fn() }) }));

const { AddItemPage } = await import('../features/items/AddItemPage');

describe('add item form accessibility', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    window.history.replaceState({}, '', '/add');
  });

  it('focuses the first invalid field and associates its error message', async () => {
    render(<AddItemPage />);
    const submit = screen.getByRole('button', { name: '離線儲存' });
    fireEvent.submit(submit.closest('form')!);

    const name = screen.getByLabelText(/物品名稱/);
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'item-name-error');
    expect(screen.getByText('請輸入物品名稱')).toHaveAttribute('role', 'alert');
  });
});
