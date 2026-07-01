import { useMemo, useState } from 'react';

import type { RetainedPhotoPayload } from '../../media/photoRetentionPolicy';

export interface ItemFormState { name: string; category: string; locationId: string; notes: string; tagNames: string[]; photo?: RetainedPhotoPayload; }
export type ItemFormErrors = Partial<Record<keyof ItemFormState, string>>;
export const emptyItemForm: ItemFormState = { name: '', category: '', locationId: '', notes: '', tagNames: [], photo: undefined };

export function validateItemForm(state: ItemFormState): ItemFormErrors {
  const errors: ItemFormErrors = {};
  if (!state.name.trim()) errors.name = '請輸入物品名稱';
  if (state.name.trim().length > 120) errors.name = '物品名稱最多 120 字';
  if (!state.category.trim()) errors.category = '請輸入分類';
  if (!state.locationId.trim()) errors.locationId = '請選擇位置';
  const invalidTag = state.tagNames.find((tag) => tag.length > 40);
  if (invalidTag) errors.tagNames = `標籤「${invalidTag}」超過 40 字`;
  return errors;
}

export function useItemForm(initial: ItemFormState = emptyItemForm) {
  const [state, setState] = useState<ItemFormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo(() => validateItemForm(state), [state]);
  const isValid = Object.keys(errors).length === 0;
  // Errors are only surfaced after a submit attempt, so a freshly opened form
  // does not look like it is already in an error state.
  const visibleErrors: ItemFormErrors = submitted ? errors : {};
  return { state, setState, errors, visibleErrors, isValid, submitted, setSubmitted };
}
