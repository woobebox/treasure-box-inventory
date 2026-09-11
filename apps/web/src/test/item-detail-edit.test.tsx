import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { createLocation } from '../db/locationRepository';
import { createItem } from '../features/items/createItem';

vi.mock('../services/householdContextValue', () => ({
  useHousehold: () => ({ householdId: 'hh-edit-ui', userId: 'u1', deviceId: 'd1', currentMember: { role: 'admin', status: 'active' } }),
}));
vi.mock('../components/toast/toastContext', () => ({ useToast: () => ({ show: vi.fn() }) }));

const { ItemDetailPage } = await import('../features/items/ItemDetailPage');

describe('item detail editing', () => {
  beforeEach(async () => { await db.delete(); await db.open(); });

  it('opens populated fields and saves updated basic information', async () => {
    const location = await createLocation({ householdId: 'hh-edit-ui', name: '玄關櫃', type: 'cabinet' });
    const created = await createItem({ householdId: 'hh-edit-ui', createdBy: 'u1', updatedBy: 'u1', deviceId: 'd1', name: '舊名稱', category: '工具', currentLocationId: location.id, notes: '舊備註', tagNames: ['常用'] });
    render(<ItemDetailPage itemId={created.itemId} />);
    await screen.findByRole('heading', { name: '舊名稱' });
    fireEvent.click(screen.getByRole('button', { name: '編輯資料' }));
    expect(screen.getByLabelText('物品名稱 *')).toHaveValue('舊名稱');
    await waitFor(() => expect(screen.getByLabelText('分類 *')).toHaveValue('工具'));
    fireEvent.change(screen.getByLabelText('物品名稱 *'), { target: { value: '新名稱' } });
    fireEvent.change(screen.getByLabelText('備註'), { target: { value: '新備註' } });
    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }));
    await waitFor(async () => expect(await db.items.get(created.itemId)).toMatchObject({ name: '新名稱', notes: '新備註' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '新名稱' })).toBeInTheDocument());
    expect(await db.history.where('itemId').equals(created.itemId).and((entry) => entry.action === 'item.updated').count()).toBe(1);
  });
});
