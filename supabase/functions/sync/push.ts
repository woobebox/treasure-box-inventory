import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { camelToRow } from '../_shared/mapping.ts';

type PushOp = { id: string; op_type: string; entity_type: string; entity_id: string; base_version?: number | null; payload: Record<string, unknown>; created_at: string };
const adminOps = new Set(['item.delete', 'item.restore', 'member.invite', 'member.remove', 'household.update']);
const createOps = new Set(['item.create', 'location.create']);

// Mirror of the web client's normalizeText (apps/web/src/domain/utils.ts) so
// server-side tag resolution matches the unique(household_id, normalized_name) key.
function normalizeText(value: string): string {
  return value.trim().normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

type SupabaseClient = ReturnType<typeof createClient>;

// Resolve tag names to ids within a household, creating missing tags. Idempotent.
async function resolveTagIds(supabase: SupabaseClient, householdId: string, tagNames: string[], at: string): Promise<string[]> {
  const ids: string[] = [];
  for (const rawName of tagNames) {
    const name = rawName.trim();
    if (!name) continue;
    const normalized = normalizeText(name);
    const { data: existing } = await supabase.from('tags').select('id').eq('household_id', householdId).eq('normalized_name', normalized).is('deleted_at', null).maybeSingle();
    if (existing?.id) { ids.push(existing.id as string); continue; }
    const { data: inserted, error } = await supabase.from('tags').insert({ household_id: householdId, name, normalized_name: normalized, created_at: at, updated_at: at }).select('id').single();
    if (error || !inserted?.id) throw new Error(`tag_upsert_failed: ${error?.message ?? 'unknown'}`);
    ids.push(inserted.id as string);
  }
  return ids;
}

// Apply one op's domain effects to the entity tables. Throws on failure so the
// caller can mark the op conflicted/failed instead of acking unpersisted data.
// Returns the server-side version that ended up persisted (for the ack).
async function applyOp(supabase: SupabaseClient, householdId: string, op: PushOp): Promise<number> {
  const at = new Date().toISOString();
  const payload = op.payload ?? {};
  switch (op.op_type) {
    case 'item.create':
    case 'item.update':
    case 'item.move':
    case 'item.delete':
    case 'item.restore': {
      const item = payload.item as Record<string, unknown> | undefined;
      if (!item) throw new Error('missing_item_payload');
      const { error: itemError } = await supabase.from('items').upsert(camelToRow(item));
      if (itemError) throw new Error(itemError.message);
      if (payload.photo) {
        const { error: photoError } = await supabase.from('photos').upsert(camelToRow(payload.photo as Record<string, unknown>));
        if (photoError) throw new Error(photoError.message);
      }
      if (Array.isArray(payload.tagNames)) {
        const tagIds = await resolveTagIds(supabase, householdId, payload.tagNames as string[], at);
        await supabase.from('item_tags').delete().eq('item_id', op.entity_id);
        if (tagIds.length) {
          const rows = tagIds.map((tagId) => ({ item_id: op.entity_id, tag_id: tagId, household_id: householdId, created_at: at }));
          const { error: linkError } = await supabase.from('item_tags').upsert(rows);
          if (linkError) throw new Error(linkError.message);
        }
      }
      const historyEntry = (payload.history ?? payload.historyEntry) as Record<string, unknown> | undefined;
      if (historyEntry) {
        const { error: historyError } = await supabase.from('history').upsert(camelToRow(historyEntry));
        if (historyError) throw new Error(historyError.message);
      }
      return Number((item as { version?: number }).version ?? 1);
    }
    case 'location.create':
    case 'location.update': {
      const location = payload.location as Record<string, unknown> | undefined;
      if (!location) throw new Error('missing_location_payload');
      const { error } = await supabase.from('locations').upsert(camelToRow(location));
      if (error) throw new Error(error.message);
      return Number((location as { version?: number }).version ?? 1);
    }
    case 'photo.add':
    case 'photo.remove': {
      const photo = payload.photo as Record<string, unknown> | undefined;
      if (!photo) throw new Error('missing_photo_payload');
      const { error } = await supabase.from('photos').upsert(camelToRow(photo));
      if (error) throw new Error(error.message);
      const historyEntry = payload.historyEntry as Record<string, unknown> | undefined;
      if (historyEntry) {
        const { error: historyError } = await supabase.from('history').upsert(camelToRow(historyEntry));
        if (historyError) throw new Error(historyError.message);
      }
      return Number((photo as { version?: number }).version ?? 1);
    }
    default:
      throw new Error(`unsupported_op_type: ${op.op_type}`);
  }
}

export async function handlePush(request: Request): Promise<Response> {
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
  // Apply in dependency order within a batch: locations before items so an
  // item's current_location_id foreign key resolves even when both are new.
  const rank = (t: string) => (t.startsWith('location') ? 0 : t.startsWith('item') ? 1 : 2);
  const ordered = [...body.ops].sort((a, b) => rank(a.op_type) - rank(b.op_type));
  for (const op of ordered) {
    if (adminOps.has(op.op_type) && member.role !== 'admin') { conflicts.push({ op_id: op.id, reason: 'admin_required' }); continue; }
    if (op.payload?.householdId && op.payload.householdId !== body.household_id) { conflicts.push({ op_id: op.id, reason: 'household_mismatch' }); continue; }

    // Optimistic-concurrency check for update-style ops: compare the client's
    // base_version against the row currently stored on the server.
    if (!createOps.has(op.op_type) && op.base_version != null) {
      const table = op.entity_type;
      const { data: current } = await supabase.from(table).select('version').eq('id', op.entity_id).maybeSingle();
      if (current && Number(current.version) !== Number(op.base_version)) {
        conflicts.push({ op_id: op.id, reason: 'version_conflict' });
        continue;
      }
    }

    let serverVersion = Number(op.payload?.version ?? 1);
    try {
      serverVersion = await applyOp(supabase, body.household_id, op);
    } catch (error) {
      conflicts.push({ op_id: op.id, reason: error instanceof Error ? error.message : 'apply_failed' });
      continue;
    }

    // Record the op in the queue table only after the entity write succeeded.
    const now = new Date().toISOString();
    const { error } = await supabase.from('sync_ops').upsert({ id: op.id, household_id: body.household_id, actor_id: auth.user.id, device_id: body.device_id, op_type: op.op_type, entity_type: op.entity_type, entity_id: op.entity_id, base_version: op.base_version ?? null, payload: op.payload, status: 'synced', retry_count: 0, created_at: op.created_at, updated_at: now, synced_at: now });
    if (error) conflicts.push({ op_id: op.id, reason: error.message });
    else acks.push({ op_id: op.id, entity_id: op.entity_id, status: 'synced', server_version: serverVersion });
  }
  const cursor = new Date().toISOString();
  await supabase.from('device_sync').upsert({ household_id: body.household_id, user_id: auth.user.id, device_id: body.device_id, last_pushed_at: cursor, updated_at: cursor }, { onConflict: 'household_id,user_id,device_id' });
  return Response.json({ cursor, acks, conflicts });
}
