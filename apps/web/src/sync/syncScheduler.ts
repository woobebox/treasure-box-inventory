import { db } from '../db/database';
import type { SyncOp } from '../domain/types';
import { pushOutbox, type PushResult } from './outbox';
import { pullChanges } from './pull';

export type SyncPhase = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncSchedulerState {
  enabled: boolean;
  pendingCount: number;
  phase: SyncPhase;
  message: string;
  reasons: string[];
}

export type SyncReason = 'startup' | 'manual' | 'local-write' | 'foreground' | 'online';

type PushFn = (householdId: string, deviceId: string) => Promise<PushResult>;
type PullFn = (householdId: string, deviceId: string) => Promise<{ applied: number; cursor?: string }>;

export interface SyncSchedulerConfig {
  householdId: string;
  deviceId: string;
  enabled: boolean;
  pushFn?: PushFn;
  pullFn?: PullFn;
}

export const PUSH_DEBOUNCE_MS = 2500;
export const FOREGROUND_THROTTLE_MS = 30_000;

const OFFLINE_MESSAGE = '純離線模式，未啟用雲端同步。';
const IDLE_MESSAGE = '尚未執行同步。';

interface ActiveConfig { householdId: string; deviceId: string; pushFn: PushFn; pullFn: PullFn; }

let activeConfig: ActiveConfig | null = null;
let state: SyncSchedulerState = { enabled: false, pendingCount: 0, phase: 'idle', message: OFFLINE_MESSAGE, reasons: [] };
const listeners = new Set<() => void>();

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let lastFullSyncStartedAt = 0;
let inFlight: Promise<void> | null = null;
// Bumped by configure()/stop() so a sync finishing after a household switch or
// logout cannot write stale results into the new context.
let generation = 0;

let detachTriggers: (() => void) | null = null;

function setState(patch: Partial<SyncSchedulerState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

async function countPending(householdId: string): Promise<number> {
  return db.syncOps.where('householdId').equals(householdId).filter((op) => op.status !== 'synced').count();
}

function onSyncOpCreating(this: unknown, _primKey: string, op: SyncOp): void {
  if (!activeConfig || op.householdId !== activeConfig.householdId) return;
  notifyLocalWrite();
}

function attachTriggers(): void {
  db.syncOps.hook('creating', onSyncOpCreating);
  const onVisibility = () => { if (document.visibilityState === 'visible') void requestSync('foreground'); };
  const onOnline = () => { void requestSync('online'); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  detachTriggers = () => {
    db.syncOps.hook('creating').unsubscribe(onSyncOpCreating);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', onOnline);
  };
}

export function configure(config: SyncSchedulerConfig): void {
  stop();
  if (!config.enabled) {
    setState({ enabled: false, pendingCount: 0, phase: 'idle', message: OFFLINE_MESSAGE, reasons: [] });
    return;
  }
  activeConfig = {
    householdId: config.householdId,
    deviceId: config.deviceId,
    pushFn: config.pushFn ?? pushOutbox,
    pullFn: config.pullFn ?? pullChanges
  };
  setState({ enabled: true, pendingCount: 0, phase: 'idle', message: IDLE_MESSAGE, reasons: [] });
  attachTriggers();
  const gen = generation;
  void countPending(activeConfig.householdId).then((pending) => {
    if (gen === generation) setState({ pendingCount: pending });
  });
  void requestSync('startup');
}

export function stop(): void {
  generation += 1;
  clearTimeout(debounceTimer);
  debounceTimer = undefined;
  detachTriggers?.();
  detachTriggers = null;
  activeConfig = null;
  lastFullSyncStartedAt = 0;
  inFlight = null;
}

// Local writes are debounced so a burst of mutations becomes one push.
export function notifyLocalWrite(): void {
  if (!activeConfig) return;
  setState({ pendingCount: state.pendingCount + 1 });
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { void requestSync('local-write'); }, PUSH_DEBOUNCE_MS);
}

export function requestSync(reason: SyncReason): Promise<void> {
  if (!activeConfig) return Promise.resolve();
  const throttled = reason === 'foreground' || reason === 'online';
  if (throttled && Date.now() - lastFullSyncStartedAt < FOREGROUND_THROTTLE_MS) return Promise.resolve();
  if (inFlight) return inFlight;
  const { householdId, deviceId, pushFn, pullFn } = activeConfig;
  const gen = generation;
  lastFullSyncStartedAt = Date.now();
  setState({ phase: 'syncing', message: '同步中…' });
  inFlight = (async () => {
    try {
      const pushed = await pushFn(householdId, deviceId);
      const pulled = await pullFn(householdId, deviceId);
      const pending = await countPending(householdId);
      if (gen !== generation) return;
      setState({
        phase: pushed.conflicted > 0 || pushed.failed > 0 ? 'error' : 'success',
        pendingCount: pending,
        message: `已推送 ${pushed.synced} 筆，失敗 ${pushed.failed} 筆，衝突 ${pushed.conflicted} 筆，拉取 ${pulled.applied} 筆。`,
        reasons: pushed.reasons ?? []
      });
    } catch (error) {
      if (gen !== generation) return;
      setState({ phase: 'error', message: error instanceof Error ? error.message : '同步失敗。', reasons: [] });
    } finally {
      if (gen === generation) inFlight = null;
    }
  })();
  return inFlight;
}

export function getState(): SyncSchedulerState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
