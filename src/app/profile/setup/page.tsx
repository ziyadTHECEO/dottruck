import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TransporteurSetupWizard from '@/components/TransporteurSetupWizard'
import TransporteurProfileView from '@/components/TransporteurProfileView'

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ resend?: string; fields?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const params = await searchParams
  const isResend = params.resend === 'true'
  const targetFields = params.fields?.split(',').filter(Boolean) ?? []

  // Check if the user already has a profile with documents
  const { data: existingProfile } = await supabase
    .from('transporteur_profiles')
    .select('vehicle_type, photo_carte_grise, photo_autorisation, photo_vehicule, verification_status')
    .eq('user_id', user.id)
    .single()

  // If resend mode, fetch the latest resend notification for context (body + audio)
  let resendNotification: { body: string; audio_url: string | null } | null = null
  if (isResend) {
    const { data } = await supabase
      .from('notifications')
      .select('body, audio_url')
      .eq('user_id', user.id)
      .eq('type', 'verification_resend')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    resendNotification = data
  }

  // If resend mode → show the wizard in resend mode
  if (isResend && targetFields.length > 0) {
    return (
      <TransporteurSetupWizard
        userId={user.id}
        resendMode={{ targetFields, message: resendNotification?.body ?? null, audioUrl: resendNotification?.audio_url ?? null }}
      />
    )
  }

  // If user already submitted profile with at least one document → show profile view
  if (existingProfile && (existingProfile.photo_carte_grise || existingProfile.photo_autorisation || existingProfile.photo_vehicule)) {
    const { data: userInfo } = await supabase
      .from('users')
      .select('nom, email, phone, ville, avatar_url')
      .eq('id', user.id)
      .single()

    return (
      <TransporteurProfileView
        profile={existingProfile}
        user={userInfo}
      />
    )
  }

  // Otherwise show the normal setup wizard
  return <TransporteurSetupWizard userId={user.id} />
}
