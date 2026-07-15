import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { buildSyncOp } from '../sync/syncOpFactory';
import {
  FOREGROUND_THROTTLE_MS,
  PUSH_DEBOUNCE_MS,
  configure,
  getState,
  notifyLocalWrite,
  requestSync,
  stop
} from '../sync/syncScheduler';

const householdId = 'sched-household';
const deviceId = 'sched-device';

function makeFns() {
  const pushFn = vi.fn(async () => ({ synced: 0, conflicted: 0, failed: 0, reasons: [] as string[] }));
  const pullFn = vi.fn(async () => ({ applied: 0 }));
  return { pushFn, pullFn };
}

function enqueueOp() {
  return db.syncOps.add(buildSyncOp({
    householdId, actorId: 'sched-user', deviceId,
    opType: 'item.update', entityType: 'items', entityId: `entity-${Math.random()}`,
    payload: {}
  }));
}

describe('sync scheduler', () => {
  beforeEach(async () => {
    await db.syncOps.clear();
    // shouldAdvanceTime 讓 fake-indexeddb 內部的 setTimeout 排程照常運作，
    // 測試只用 advanceTimersByTimeAsync 控制去抖動/節流的大跳躍。
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it('本地寫入在去抖動窗內合併為一次推送', async () => {
    const { pushFn, pullFn } = makeFns();
    configure({ householdId, deviceId, enabled: true, pushFn, pullFn });
    await vi.runAllTimersAsync(); // startup 同步完成
    pushFn.mockClear();

    notifyLocalWrite();
    notifyLocalWrite();
    notifyLocalWrite();
    await vi.advanceTimersByTimeAsync(PUSH_DEBOUNCE_MS - 1);
    expect(pushFn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    expect(pushFn).toHaveBeenCalledTimes(1);
  });

  it('Dexie syncOps 寫入 hook 會排程自動推送', async () => {
    const { pushFn, pullFn } = makeFns();
    configure({ householdId, deviceId, enabled: true, pushFn, pullFn });
    await vi.runAllTimersAsync();
    pushFn.mockClear();

    await enqueueOp();
    await vi.advanceTimersByTimeAsync(PUSH_DEBOUNCE_MS);
    await vi.runAllTimersAsync();
    expect(pushFn).toHaveBeenCalledTimes(1);
    expect(getState().pendingCount).toBe(1); // mock push 沒有標記 synced
  });

  it('同步進行中重複觸發不會並發', async () => {
    const { pullFn } = makeFns();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const pushFn = vi.fn(async () => { await gate; return { synced: 0, conflicted: 0, failed: 0, reasons: [] as string[] }; });
    configure({ householdId, deviceId, enabled: true, pushFn, pullFn });

    void requestSync('manual');
    void requestSync('manual');
    expect(pushFn).toHaveBeenCalledTimes(1);
    expect(getState().phase).toBe('syncing');
    release();
    await vi.runAllTimersAsync();
    expect(getState().phase).toBe('success');
  });

  it('前景與上線觸發受最小間隔節流', async () => {
    const { pushFn, pullFn } = makeFns();
    configure({ householdId, deviceId, enabled: true, pushFn, pullFn });
    await vi.runAllTimersAsync(); // startup 佔用節流窗
    pushFn.mockClear();

    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.runAllTimersAsync();
    expect(pushFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(FOREGROUND_THROTTLE_MS + 1);
    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();
    expect(pushFn).toHaveBeenCalledTimes(1);
  });

  it('停用（純離線）時不註冊觸發器也不推送', async () => {
    const { pushFn, pullFn } = makeFns();
    configure({ householdId, deviceId, enabled: false, pushFn, pullFn });
    expect(getState().enabled).toBe(false);

    await enqueueOp();
    notifyLocalWrite();
    await requestSync('manual');
    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();
    expect(pushFn).not.toHaveBeenCalled();
    expect(pullFn).not.toHaveBeenCalled();
  });

  it('stop 之後既排程的去抖動與事件不再觸發', async () => {
    const { pushFn, pullFn } = makeFns();
    configure({ householdId, deviceId, enabled: true, pushFn, pullFn });
    await vi.runAllTimersAsync();
    pushFn.mockClear();

    notifyLocalWrite();
    stop();
    await vi.advanceTimersByTimeAsync(PUSH_DEBOUNCE_MS * 2);
    window.dispatchEvent(new Event('online'));
    await vi.runAllTimersAsync();
    expect(pushFn).not.toHaveBeenCalled();
  });
});
