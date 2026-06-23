import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const entities = ['items', 'locations', 'photos', 'tags', 'item_tags', 'history'];
Deno.serve(async (request) => {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(request.url); const householdId = url.searchParams.get('household_id'); const deviceId = url.searchParams.get('device_id') ?? 'unknown'; const cursor = url.searchParams.get('cursor') ?? '1970-01-01T00:00:00.000Z';
  if (!householdId) return Response.json({ error: 'household_id required' }, { status: 400 });
  const authHeader = request.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: member } = await supabase.from('household_members').select('id').eq('household_id', householdId).eq('user_id', auth.user.id).eq('status', 'active').maybeSingle();
  if (!member) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const changes = [];
  for (const entity of entities) {
    const { data } = await supabase.from(entity).select('*').eq('household_id', householdId).gt('updated_at', cursor).order('updated_at', { ascending: true }).limit(200);
    for (const row of data ?? []) changes.push({ entity_type: entity, entity_id: row.id ?? `${row.item_id}:${row.tag_id}`, version: row.version ?? 1, deleted_at: row.deleted_at ?? null, payload: row });
  }
  const next = new Date().toISOString();
  await supabase.from('device_sync').upsert({ household_id: householdId, user_id: auth.user.id, device_id: deviceId, last_pulled_cursor: next, updated_at: next }, { onConflict: 'household_id,user_id,device_id' });
  return Response.json({ cursor: next, changes });
});
