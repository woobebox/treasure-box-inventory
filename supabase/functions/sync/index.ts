// Router for the `sync` Edge Function. Deployed as one function named `sync`,
// it dispatches by trailing path so the web client can call:
//   supabase.functions.invoke('sync/push', ...)     -> handlePush
//   supabase.functions.invoke('sync/changes?...')   -> handleChanges
// (see apps/web/src/sync/outbox.ts and pull.ts).
import { handlePush } from './push.ts';
import { handleChanges } from './changes.ts';
import { preflightResponse, withCors } from '../_shared/cors.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return preflightResponse();
  const { pathname } = new URL(request.url);
  if (pathname.endsWith('/push')) return withCors(await handlePush(request));
  if (pathname.endsWith('/changes')) return withCors(await handleChanges(request));
  return withCors(Response.json({ error: 'Not found' }, { status: 404 }));
});
