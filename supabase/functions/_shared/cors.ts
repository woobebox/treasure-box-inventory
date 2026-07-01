// Shared CORS handling for browser calls to the sync Edge Function.
// Browsers send an OPTIONS preflight and require Access-Control-Allow-* headers
// on the actual response; without them the fetch fails before reaching our code
// ("Failed to send a request to the Edge Function" in supabase-js).
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

export function preflightResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}

// Return a new Response with the CORS headers merged in.
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
