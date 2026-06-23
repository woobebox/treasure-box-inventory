import { useMemo, useState } from 'react';

import type { RetainedPhotoPayload } from '../../media/photoRetentionPolicy';

export interface ItemFormState { name: string; category: string; locationId: string; notes: string; dueAt: string; tagNames: string[]; photo?: RetainedPhotoPayload; }
export type ItemFormErrors = Partial<Record<keyof ItemFormState, string>>;
export const emptyItemForm: ItemFormState = { name: '', category: '', locationId: '', notes: '', dueAt: '', tagNames: [], photo: undefined };

export function validateItemForm(state: ItemFormState): ItemFormErrors {
  const errors: ItemFormErrors = {};
  if (!state.name.trim()) errors.name = '請輸入物品名稱';
  if (state.name.trim().length > 120) errors.name = '物品名稱最多 120 字';
  if (!state.category.trim()) errors.category = '請輸入分類';
  if (!state.locationId.trim()) errors.locationId = '請輸入位置 ID';
  if (state.dueAt && Number.isNaN(Date.parse(state.dueAt))) errors.dueAt = '請輸入有效日期';
  const invalidTag = state.tagNames.find((tag) => tag.length > 40);
  if (invalidTag) errors.tagNames = `標籤「${invalidTag}」超過 40 字`;
  return errors;
}

export function useItemForm(initial: ItemFormState = emptyItemForm) {
  const [state, setState] = useState<ItemFormState>(initial);
  const errors = useMemo(() => validateItemForm(state), [state]);
  const isValid = Object.keys(errors).length === 0;
  return { state, setState, errors, isValid };
}
