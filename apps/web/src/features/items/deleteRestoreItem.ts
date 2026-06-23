import { db } from '../../db/database';
import type { HouseholdMember } from '../../domain/types';
import { nowIso } from '../../domain/utils';
import { canDeleteOrRestore } from '../../services/authorization';

export async function softDeleteItem(itemId: string, member?: HouseholdMember): Promise<void> { if (!canDeleteOrRestore(member)) throw new Error('Only household admins can delete items.'); await db.items.update(itemId, { status: 'deleted', deletedAt: nowIso(), updatedAt: nowIso() }); }
export async function restoreItem(itemId: string, member?: HouseholdMember): Promise<void> { if (!canDeleteOrRestore(member)) throw new Error('Only household admins can restore items.'); await db.items.update(itemId, { status: 'active', deletedAt: null, updatedAt: nowIso() }); }
