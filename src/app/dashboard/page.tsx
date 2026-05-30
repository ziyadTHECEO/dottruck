import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVisibleChargeTypes } from '@/lib/matching'
import { getVerificationState } from '@/lib/verification'
import { DashboardContent } from '@/components/DashboardContent'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import OnboardingTutorial from '@/components/OnboardingTutorial'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, transporteur_profiles(*)')
    .eq('id', user.id)
    .single()

  const rawProfiles = userProfile?.transporteur_profiles
  const transporteurProfile = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as {
    type: 'A' | 'B' | 'C'
    description_vehicule: string | null
    score: number
    verification_status?: string
    photo_carte_grise?: string | null
    photo_autorisation?: string | null
    photo_vehicule?: string | null
  } | null | undefined ?? null

  const { blocked, resendFields } = await getVerificationState(user.id, userProfile?.role)

  let charges: Array<{
    id: string
    ville_depart: string
    ville_arrivee: string
    type_requis: string
    poids_kg: number | null
    prix_total_mad: number
    statut: string
    created_at: string
  }> = []

  if (userProfile?.role === 'transporteur' && transporteurProfile) {
    const visibleTypes = getVisibleChargeTypes(transporteurProfile.type)
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('statut', 'ouverte')
      .in('type_requis', visibleTypes)
      .order('created_at', { ascending: false })
    charges = data ?? []
  } else if (userProfile?.role === 'expéditeur') {
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
    charges = data ?? []
  }

  const isTransporteur = userProfile?.role === 'transporteur'
  const userName = userProfile?.nom?.split(' ')[0] ?? ''
  const showOnboarding = !(userProfile?.onboarding_completed ?? false)
  const role = (userProfile?.role === 'transporteur' || userProfile?.role === 'expéditeur')
    ? userProfile.role
    : 'transporteur'

  return (
    <>
      {showOnboarding && (
        <OnboardingTutorial role={role} />
      )}
      <VerificationBlocker blocked={blocked} resendFields={resendFields}>
        <DashboardContent
          charges={charges}
          userProfile={userProfile}
          transporteurProfile={transporteurProfile}
          isTransporteur={isTransporteur}
          userId={user.id}
          userName={userName}
        />
      </VerificationBlocker>
    </>
  )
}
