import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { LocationForm } from '../features/locations/LocationForm';
import { LocationPicker } from '../features/locations/LocationPicker';

const householdId = 'household-location-ui';

describe('location creation interactions', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('refreshes the parent selector after creating a location', async () => {
    render(<LocationForm householdId={householdId} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('位置名稱'), { target: { value: '儲藏室' } });
    fireEvent.click(screen.getByRole('button', { name: '新增位置' }));

    await waitFor(() => expect(screen.getByRole('option', { name: '儲藏室' })).toBeInTheDocument());
    expect(screen.getByLabelText('上層位置')).toHaveValue('');
  });

  it('quick-creates and selects a location from the item location picker', async () => {
    function PickerHarness() {
      const [value, setValue] = useState('');
      return <LocationPicker householdId={householdId} value={value} onChange={setValue} actorId="user-1" deviceId="device-1" required />;
    }

    render(<PickerHarness />);
    fireEvent.click(screen.getByRole('button', { name: '新增位置' }));
    expect(screen.getByRole('button', { name: '取消新增位置' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('快速新增位置名稱'), { target: { value: '玄關櫃' } });
    fireEvent.click(screen.getByRole('button', { name: '建立並選擇' }));

    await waitFor(() => expect(screen.getByRole('combobox', { name: /位置/ })).not.toHaveValue(''));
    expect(screen.getByRole('option', { name: '玄關櫃' })).toBeInTheDocument();
    expect(screen.queryByLabelText('快速新增位置名稱')).not.toBeInTheDocument();
    expect(screen.getByText('已新增並選擇位置「玄關櫃」。')).toBeInTheDocument();
    expect(await db.syncOps.where('householdId').equals(householdId).count()).toBe(1);
  });
});
