import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Household, HouseholdMember } from '../domain/types';
import { createId, nowIso } from '../domain/utils';
import { db } from '../db/database';
import { getActiveMember } from '../db/householdRepository';
import { useAuth } from './authContext';
import { supabase } from './supabaseClient';
import { createHouseholdCloud, listMyHouseholds } from './cloudHousehold';
import {
  ACTIVE_HOUSEHOLD_KEY,
  DEMO_HOUSEHOLD_ID,
  DEMO_MEMBER,
  DEMO_USER_ID,
  HouseholdContext,
  getOrCreateDeviceId,
  type HouseholdContextValue
} from './householdContextValue';

// Mirror a cloud household (and the caller's admin membership) into local Dexie
// so the existing local-first pages and queries see it immediately.
async function mirrorHouseholdLocally(household: Household, userId: string): Promise<void> {
  const timestamp = nowIso();
  await db.transaction('rw', [db.households, db.householdMembers], async () => {
    await db.households.put(household);
    const existing = await db.householdMembers.where({ householdId: household.id, userId }).first();
    if (!existing) {
      await db.householdMembers.put({ id: createId(), householdId: household.id, userId, role: 'admin', status: 'active', joinedAt: timestamp, createdAt: timestamp, updatedAt: timestamp });
    }
  });
}

export function HouseholdProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [currentMember, setCurrentMember] = useState<HouseholdMember | undefined>();
  const [isReady, setIsReady] = useState(!supabase);

  const userId = user?.id ?? DEMO_USER_ID;

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void (async () => {
      const rows = await listMyHouseholds();
      for (const household of rows) await mirrorHouseholdLocally(household, user.id);
      if (!active) return;
      const stored = localStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
      setHouseholds(rows);
      setActiveId(rows.find((h) => h.id === stored)?.id ?? rows[0]?.id ?? '');
      setIsReady(true);
    })();
    return () => { active = false; };
  }, [user]);

  // Resolve the signed-in user's membership in the active household (for role
  // checks like admin-only delete). Offline mode uses the demo admin member.
  useEffect(() => {
    let active = true;
    const resolve = !supabase || !user || !activeId ? Promise.resolve(undefined) : getActiveMember(activeId, user.id);
    void Promise.resolve(resolve).then((member) => { if (active) setCurrentMember(member); });
    return () => { active = false; };
  }, [activeId, user]);

  const selectHousehold = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, id);
  }, []);

  const createHousehold = useCallback(async (name: string) => {
    const household = await createHouseholdCloud(name);
    if (user) await mirrorHouseholdLocally(household, user.id);
    setHouseholds((prev) => [...prev, household]);
    selectHousehold(household.id);
    return household;
  }, [user, selectHousehold]);

  const value = useMemo<HouseholdContextValue>(() => ({
    householdId: supabase ? activeId : DEMO_HOUSEHOLD_ID,
    householdName: households.find((h) => h.id === activeId)?.name ?? '',
    userId,
    deviceId,
    households,
    currentMember: supabase ? currentMember : DEMO_MEMBER,
    isReady,
    selectHousehold,
    createHousehold
  }), [activeId, households, currentMember, userId, deviceId, isReady, selectHousehold, createHousehold]);

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
