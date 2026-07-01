import type { Household } from '../domain/types';
import { supabase } from './supabaseClient';

// Cloud-side household access. These talk to Supabase directly (not through the
// sync outbox); RLS ensures a user only ever sees households they belong to.
// Row shape is snake_case from Postgres; we map the fields the app reads.

interface HouseholdRow { id: string; name: string; created_by: string; created_at: string; updated_at: string; deleted_at?: string | null }

function rowToHousehold(row: HouseholdRow): Household {
  return { id: row.id, name: row.name, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at ?? null };
}

export async function listMyHouseholds(): Promise<Household[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('households').select('*').is('deleted_at', null).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as HouseholdRow[] | null ?? []).map(rowToHousehold);
}

export async function createHouseholdCloud(name: string): Promise<Household> {
  if (!supabase) throw new Error('尚未設定 Supabase。');
  const { data, error } = await supabase.rpc('create_household', { p_name: name });
  if (error) throw new Error(error.message);
  // The RPC returns the inserted households row.
  const row = (Array.isArray(data) ? data[0] : data) as HouseholdRow;
  return rowToHousehold(row);
}
