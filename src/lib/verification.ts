import { createClient } from '@/lib/supabase/server'

export interface VerificationState {
  blocked: boolean
  resendFields: string[]
}

export async function getVerificationState(userId: string, role?: string): Promise<VerificationState> {
  if (role !== 'transporteur') return { blocked: false, resendFields: [] }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('transporteur_profiles')
    .select('verification_status, photo_carte_grise, photo_autorisation, photo_vehicule')
    .eq('user_id', userId)
    .single()

  if (!profile || profile.verification_status !== 'pending') {
    return { blocked: false, resendFields: [] }
  }

  const fields: string[] = []
  if (!profile.photo_carte_grise) fields.push('photo_carte_grise')
  if (!profile.photo_autorisation) fields.push('photo_autorisation')
  if (!profile.photo_vehicule) fields.push('photo_vehicule')

  // Blocked only if SOME fields are missing (not all 3 — all 3 missing means new submission)
  const blocked = fields.length > 0 && fields.length < 3

  return { blocked, resendFields: fields }
}
