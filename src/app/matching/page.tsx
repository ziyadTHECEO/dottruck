import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import MatchingContent from '@/components/MatchingContent'

export default async function MatchingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Get current user's transporteur profile
  const { data: myProfile } = await supabase
    .from('transporteur_profiles')
    .select('type')
    .eq('user_id', user.id)
    .maybeSingle()

  // Determine what type of partners to show
  const lookingForType = myProfile?.type === 'A' ? 'B' : myProfile?.type === 'B' ? 'A' : null

  // Fetch available partners
  let partners: Array<{
    user_id: string
    type: string
    description_vehicule: string | null
    score: number
    capacite_tonnes: number | null
    disponible: boolean
    nom: string
    ville: string | null
    ratingsCount: number
  }> = []

  if (lookingForType) {
    const { data: profiles } = await supabase
      .from('transporteur_profiles')
      .select('user_id, type, description_vehicule, score, capacite_tonnes, disponible')
      .eq('type', lookingForType)
      .eq('disponible', true)
      .neq('user_id', user.id)

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, nom, ville')
        .in('id', userIds)

      const usersMap = new Map((users ?? []).map(u => [u.id, u]))

      partners = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('ratings')
            .select('*', { count: 'exact', head: true })
            .eq('to_user_id', p.user_id)

          const userInfo = usersMap.get(p.user_id)
          return {
            ...p,
            nom: userInfo?.nom ?? 'Transporteur',
            ville: userInfo?.ville ?? null,
            ratingsCount: count ?? 0,
          }
        })
      )
    }
  }

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { blocked, resendFields } = await getVerificationState(user.id, userRole?.role)

  return (
    <VerificationBlocker blocked={blocked} resendFields={resendFields}>
      <MatchingContent
        myProfile={myProfile ? { type: myProfile.type } : null}
        partners={partners}
        lookingForType={lookingForType}
      />
    </VerificationBlocker>
  )
}
