import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../services/supabaseClient';
import { useHousehold } from '../services/householdContextValue';
import { configure, getState, stop, subscribe, type SyncSchedulerState } from './syncScheduler';

export function useSyncStatus(): SyncSchedulerState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// Binds the sync scheduler to the signed-in household for the app's lifetime.
// Mount exactly once (AppShell); pure-offline mode keeps the scheduler disabled.
export function useAutoSync(): void {
  const { householdId, deviceId } = useHousehold();
  useEffect(() => {
    configure({ householdId, deviceId, enabled: Boolean(supabase) && Boolean(householdId) });
    return () => stop();
  }, [householdId, deviceId]);
}
