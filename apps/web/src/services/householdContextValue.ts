import { createContext, useContext } from 'react';
import type { Household, HouseholdMember } from '../domain/types';
import { createId } from '../domain/utils';

export const DEVICE_ID_KEY = 'tbi.deviceId';
export const ACTIVE_HOUSEHOLD_KEY = 'tbi.activeHouseholdId';

// Demo identifiers used in pure-offline mode (no Supabase configured). Keeps the
// app fully usable offline and preserves existing local/test behavior.
export const DEMO_HOUSEHOLD_ID = 'local-demo-household';
export const DEMO_USER_ID = 'local-demo-user';

// In pure-offline mode the local user acts as the household admin.
export const DEMO_MEMBER: HouseholdMember = {
  id: 'local-demo-member', householdId: DEMO_HOUSEHOLD_ID, userId: DEMO_USER_ID,
  role: 'admin', status: 'active', createdAt: '', updatedAt: ''
};

export function getOrCreateDeviceId(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage): string {
  const existing = storage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = createId();
  storage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export interface HouseholdContextValue {
  householdId: string;
  householdName: string;
  userId: string;
  deviceId: string;
  households: Household[];
  currentMember?: HouseholdMember;
  isReady: boolean;
  selectHousehold: (id: string) => void;
  createHousehold: (name: string) => Promise<Household>;
}

export const HouseholdContext = createContext<HouseholdContextValue | null>(null);
export function useHousehold(): HouseholdContextValue { const value = useContext(HouseholdContext); if (!value) throw new Error('useHousehold 必須在 HouseholdProvider 內使用'); return value; }
