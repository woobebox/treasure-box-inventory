import type { HistoryEntry, ItemStatus, MemberStatus, Role, SyncStatus } from './types';

export const locationTypeLabels: Record<string, string> = {
  room: '房間',
  cabinet: '櫃位',
  drawer: '抽屜',
  hook: '掛勾',
  box: '箱子',
  other: '其他'
};

export function formatLocationType(type: string): string {
  return locationTypeLabels[type] ?? type;
}

export const itemStatusLabels: Record<ItemStatus, string> = {
  active: '使用中',
  archived: '已封存',
  deleted: '已刪除'
};

export const roleLabels: Record<Role, string> = {
  admin: '管理者',
  member: '成員'
};

export const memberStatusLabels: Record<MemberStatus, string> = {
  invited: '已邀請',
  active: '啟用中',
  removed: '已移除'
};

export const syncStatusLabels: Record<SyncStatus, string> = {
  pending: '待同步',
  pushing: '同步中',
  synced: '已同步',
  failed: '同步失敗',
  conflicted: '發生衝突'
};

const historyActionLabels: Record<string, string> = {
  'item.created': '新增物品',
  'item.updated': '更新物品',
  'item.moved': '移動物品',
  'item.deleted': '刪除物品',
  'item.restored': '還原物品',
  'photo.added': '新增照片',
  'photo.removed': '移除照片'
};

export function formatHistoryAction(entry: HistoryEntry): string {
  return historyActionLabels[entry.action] ?? entry.action;
}
