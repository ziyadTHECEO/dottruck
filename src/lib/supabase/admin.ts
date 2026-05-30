import { createClient } from '@supabase/supabase-js'

/**
 * Server-only admin client — uses the service role key which bypasses RLS.
 * Only import this in server components / server actions inside the /admin route.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
