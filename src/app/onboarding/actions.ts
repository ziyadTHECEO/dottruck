'use server'

import { createClient } from '@/lib/supabase/server'

export async function markOnboardingComplete(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('id', user.id)
}
