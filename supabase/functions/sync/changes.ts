import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rowToCamel } from '../_shared/mapping.ts';

// Entities the web client knows how to apply (see pull.ts tableMap). item_tags
// are reconstructed on the client from item payloads, so they are not streamed.
// `history` rows are immutable and have no updated_at, so they page by occurred_at.
const entities: { table: string; cursorColumn: string }[] = [
  { table: 'locations', cursorColumn: 'updated_at' },
  { table: 'items', cursorColumn: 'updated_at' },
  { table: 'photos', cursorColumn: 'updated_at' },
  { table: 'tags', cursorColumn: 'updated_at' },
  { table: 'history', cursorColumn: 'occurred_at' }
];
export async function handleChanges(request: Request): Promise<Response> {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(request.url); const householdId = url.searchParams.get('household_id'); const deviceId = url.searchParams.get('device_id') ?? 'unknown';
  // A fresh device sends an empty cursor; treat empty/missing as the epoch so the
  // first pull returns the full history instead of running an invalid `> ''` compare.
  const cursorParam = url.searchParams.get('cursor');
  const cursor = cursorParam && cursorParam.length > 0 ? cursorParam : '1970-01-01T00:00:00.000Z';
  if (!householdId) return Response.json({ error: 'household_id required' }, { status: 400 });
  const authHeader = request.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: member } = await supabase.from('household_members').select('id').eq('household_id', householdId).eq('user_id', auth.user.id).eq('status', 'active').maybeSingle();
  if (!member) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const changes = [];
  for (const { table, cursorColumn } of entities) {
    const { data, error } = await supabase.from(table).select('*').eq('household_id', householdId).gt(cursorColumn, cursor).order(cursorColumn, { ascending: true }).limit(200);
    if (error) return Response.json({ error: `changes_query_failed: ${table}: ${error.message}` }, { status: 500 });
    for (const row of data ?? []) changes.push({ entity_type: table, entity_id: (row.id ?? `${row.item_id}:${row.tag_id}`) as string, version: (row.version ?? 1) as number, deleted_at: (row.deleted_at ?? null) as string | null, payload: rowToCamel(row) });
  }
  const next = new Date().toISOString();
  await supabase.from('device_sync').upsert({ household_id: householdId, user_id: auth.user.id, device_id: deviceId, last_pulled_cursor: next, updated_at: next }, { onConflict: 'household_id,user_id,device_id' });
  return Response.json({ cursor: next, changes });
}
