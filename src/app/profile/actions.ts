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
  }, { onConflict: 'user_id' })

  if (error) {
    return redirect(`/profile/setup?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}

// Map vehicle types to A/B/C system
// A = camion seul (tractor only, needs remorque partner)
// B = plateau/remorque (trailer only, needs camion partner)
// C = complete truck (camion + integrated cargo area)
function vehicleTypeToLegacy(vehicleType: string): 'A' | 'B' | 'C' {
  switch (vehicleType) {
    case 'camion_seul': return 'A'
    case 'plateau_barres':
    case 'plateau': return 'B'
    case 'frigorifique':
    case 'benne': return 'C'
    default: return 'C'
  }
}

export async function completeTransporteurSetup(data: {
  avatarUrl: string
  vehicleType: string
  carteGriseUrl: string
  autorisationUrl: string
  photoVehiculeUrl: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Update avatar on users table
  await supabase
    .from('users')
    .update({ avatar_url: data.avatarUrl })
    .eq('id', user.id)

  // Upsert transporteur profile with all new fields
  const { error } = await supabase.from('transporteur_profiles').upsert({
    user_id: user.id,
    type: vehicleTypeToLegacy(data.vehicleType),
    vehicle_type: data.vehicleType,
    photo_carte_grise: data.carteGriseUrl,
    photo_autorisation: data.autorisationUrl,
    photo_vehicule: data.photoVehiculeUrl,
    verification_status: 'pending',
  }, { onConflict: 'user_id' })

  if (error) return { success: false, error: error.message }

  return { success: true }
}

// Admin actions — use admin client to bypass RLS
export async function verifyTransporteur(
  userId: string,
  decision: 'verified' | 'rejected' | 'resend',
  reason?: string,
  audioUrl?: string,
  targetFields?: string[]
): Promise<{ success: boolean; error?: string }> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  if (decision === 'resend') {
    // Only null out the specific fields admin wants re-uploaded
    const fields = targetFields?.filter(f => ['photo_carte_grise', 'photo_autorisation', 'photo_vehicule'].includes(f)) ?? []
    if (fields.length === 0) return { success: false, error: 'No valid fields specified' }
    const updatePayload: Record<string, string | null> = {
      verification_status: 'pending',
      rejection_reason: reason || null,
    }
    for (const f of fields) {
      updatePayload[f] = null
    }

    const { error } = await supabase
      .from('transporteur_profiles')
      .update(updatePayload)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }

    const fieldsParam = fields.join(',')
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'verification_resend',
      title: 'أعد إرسال الوثائق',
      body: reason
        ? `خاصك تعاود ترسل الوثائق ديالك. السبب: ${reason}`
        : 'خاصك تعاود ترسل الوثائق ديالك.',
      audio_url: audioUrl || null,
      action_url: `/profile/setup?resend=true&fields=${fieldsParam}`,
      metadata: { target_fields: fields, audio_url: audioUrl || null },
    })

    return { success: true }
  }

  const updateData: Record<string, string | null> = {
    verification_status: decision,
  }
  if (decision === 'rejected' && reason) {
    updateData.rejection_reason = reason
  } else {
    updateData.rejection_reason = null
  }

  const { error } = await supabase
    .from('transporteur_profiles')
    .update(updateData)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  // Insert notification for the transporteur
  const notifBody = decision === 'verified'
    ? 'تم التحقق من حسابك! دابا تقدر تقبل الشحنات.'
    : `تم رفض حسابك. السبب: ${reason ?? 'غير محدد'}`

  await supabase.from('notifications').insert({
    user_id: userId,
    type: decision === 'verified' ? 'verification_approved' : 'verification_rejected',
    title: decision === 'verified' ? 'حساب مُتحقق ✓' : 'حساب مرفوض',
    body: notifBody,
  })

  return { success: true }
}
