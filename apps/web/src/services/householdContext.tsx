import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Household, HouseholdMember } from '../domain/types';
import { db } from '../db/database';
import { useAuth } from './authContext';
import { supabase } from './supabaseClient';
import { createHouseholdCloud, listMyHouseholds, listMyMemberships } from './cloudHousehold';
import { ACTIVE_HOUSEHOLD_KEY, DEMO_HOUSEHOLD_ID, DEMO_MEMBER, DEMO_USER_ID, HouseholdContext, getOrCreateDeviceId, type HouseholdContextValue } from './householdContextValue';

// Replace only this user's cached membership, including stale elevated roles.
// Inventory and other users' offline data remain untouched.
async function mirrorHouseholdsLocally(households: Household[], memberships: HouseholdMember[], userId: string, isCurrent: () => boolean): Promise<void> {
  await db.transaction('rw', [db.households, db.householdMembers], async () => {
    if (!isCurrent()) throw new Error('stale_session');
    await db.households.bulkPut(households);
    await db.householdMembers.where('userId').equals(userId).delete();
    await db.householdMembers.bulkPut(memberships);
    if (!isCurrent()) throw new Error('stale_session');
  });
}

export function HouseholdProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  // A keyed remount isolates the first render of a changed/signed-out user.
  return <HouseholdStateProvider key={user?.id ?? 'signed-out'}>{children}</HouseholdStateProvider>;
}

function HouseholdStateProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const userId = user?.id ?? DEMO_USER_ID;
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [memberships, setMemberships] = useState<HouseholdMember[]>([]);
  const [activeId, setActiveId] = useState('');
  const [isReady, setIsReady] = useState(!supabase);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const isCurrent = () => generation.current === currentGeneration;
    if (supabase && userId !== DEMO_USER_ID) {
      void (async () => {
        try {
          const [rows, members] = await Promise.all([listMyHouseholds(), listMyMemberships(userId)]);
          if (!isCurrent()) return;
          const authorized = rows.filter((household) => members.some((member) => member.householdId === household.id));
          const visibleMembers = members.filter((member) => authorized.some((household) => household.id === member.householdId));
          await mirrorHouseholdsLocally(authorized, visibleMembers, userId, isCurrent);
          if (!isCurrent()) return;
          const stored = localStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
          setHouseholds(authorized);
          setMemberships(visibleMembers);
          setActiveId(authorized.find((household) => household.id === stored)?.id ?? authorized[0]?.id ?? '');
          setError('');
          setIsReady(true);
        } catch {
          if (isCurrent()) setError('無法載入家庭資料，請重試或重新登入。');
        }
      })();
    }
    return () => { generation.current = currentGeneration + 1; };
  }, [userId, reloadCount]);

  const selectHousehold = useCallback((id: string) => {
    if (!isReady || !households.some((household) => household.id === id)) return;
    setActiveId(id);
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, id);
  }, [households, isReady]);

  const retry = useCallback(() => {
    setError('');
    setIsReady(false);
    setActiveId('');
    setReloadCount((count) => count + 1);
  }, []);

  const createHousehold = useCallback(async (name: string) => {
    if (!user || !isReady) throw new Error('請先登入並完成家庭資料載入。');
    const startedAt = generation.current;
    const isCurrent = () => generation.current === startedAt;
    const household = await createHouseholdCloud(name);
    if (!isCurrent()) throw new Error('登入帳號已變更，請重新載入家庭資料。');
    const members = await listMyMemberships(user.id);
    const membership = members.find((member) => member.householdId === household.id);
    if (!membership) throw new Error('無法確認新家庭的成員權限，請重新登入後載入家庭資料。');
    await mirrorHouseholdsLocally([...households, household], [...memberships.filter((member) => member.householdId !== household.id), membership], user.id, isCurrent);
    if (!isCurrent()) throw new Error('登入帳號已變更，請重新載入家庭資料。');
    setHouseholds((previous) => [...previous.filter((row) => row.id !== household.id), household]);
    setMemberships((previous) => [...previous.filter((member) => member.householdId !== household.id), membership]);
    setActiveId(household.id);
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, household.id);
    return household;
  }, [user, isReady, households, memberships]);

  const value = useMemo<HouseholdContextValue>(() => ({
    householdId: supabase ? (isReady ? activeId : '') : DEMO_HOUSEHOLD_ID,
    householdName: households.find((household) => household.id === activeId)?.name ?? '',
    userId, deviceId, households,
    currentMember: supabase ? (isReady ? memberships.find((member) => member.householdId === activeId) : undefined) : DEMO_MEMBER,
    isReady, error, retry, selectHousehold, createHousehold
  }), [activeId, households, memberships, userId, deviceId, isReady, error, retry, selectHousehold, createHousehold]);

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
