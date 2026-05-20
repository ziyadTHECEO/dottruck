'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function setupTransporteurProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const type = formData.get('type') as 'A' | 'B' | 'C'
  const description_vehicule = formData.get('description_vehicule') as string

  const { error } = await supabase.from('transporteur_profiles').upsert({
    user_id: user.id,
    type,
    description_vehicule,
  })

  if (error) {
    return redirect(`/profile/setup?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}
