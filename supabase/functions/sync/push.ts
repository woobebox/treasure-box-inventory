import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type PushOp = { id: string; op_type: string; entity_type: string; entity_id: string; base_version?: number | null; payload: Record<string, unknown>; created_at: string };
const adminOps = new Set(['item.delete', 'item.restore', 'member.invite', 'member.remove', 'household.update']);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authHeader = request.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json() as { household_id?: string; device_id?: string; ops?: PushOp[] };
  if (!body.household_id || !body.device_id || !Array.isArray(body.ops)) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const { data: member } = await supabase.from('household_members').select('role,status').eq('household_id', body.household_id).eq('user_id', auth.user.id).eq('status', 'active').maybeSingle();
  if (!member) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const acks = []; const conflicts = [];
  for (const op of body.ops) {
    if (adminOps.has(op.op_type) && member.role !== 'admin') { conflicts.push({ op_id: op.id, reason: 'admin_required' }); continue; }
    if (op.payload?.householdId && op.payload.householdId !== body.household_id) { conflicts.push({ op_id: op.id, reason: 'household_mismatch' }); continue; }
    const { error } = await supabase.from('sync_ops').upsert({ id: op.id, household_id: body.household_id, actor_id: auth.user.id, device_id: body.device_id, op_type: op.op_type, entity_type: op.entity_type, entity_id: op.entity_id, base_version: op.base_version ?? null, payload: op.payload, status: 'synced', retry_count: 0, created_at: op.created_at, updated_at: new Date().toISOString(), synced_at: new Date().toISOString() });
    if (error) conflicts.push({ op_id: op.id, reason: error.message }); else acks.push({ op_id: op.id, entity_id: op.entity_id, status: 'synced', server_version: Number(op.payload?.version ?? 1) });
  }
  const cursor = new Date().toISOString();
  await supabase.from('device_sync').upsert({ household_id: body.household_id, user_id: auth.user.id, device_id: body.device_id, last_pushed_at: cursor, updated_at: cursor }, { onConflict: 'household_id,user_id,device_id' });
  return Response.json({ cursor, acks, conflicts });
});
