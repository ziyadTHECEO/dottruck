import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileSettingsContent from '@/components/ProfileSettingsContent'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get ratings received
  const { data: ratings } = await supabase
    .from('ratings')
    .select('note, commentaire, created_at, from_user_id')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  const ratingsCount = ratings?.length ?? 0
  const avgRating = ratingsCount > 0
    ? Math.round((ratings!.reduce((sum, r) => sum + r.note, 0) / ratingsCount) * 10) / 10
    : 0

  // Get completed matchings count
  const { count: completedCount } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .in('statut', ['accepté', 'completé'])

  const { count: totalMatchings } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)

  const completed = completedCount ?? 0
  const total = totalMatchings ?? 0
  const acceptanceRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const cancellationRate = total > 0 ? 100 - acceptanceRate : 0

  const displayName = userProfile?.nom ?? user.user_metadata?.nom ?? 'Utilisateur'
  const displayEmail = userProfile?.email ?? user.email ?? ''

  // Fetch verification status for transporteurs
  let verificationStatus: string | null = null
  let avatarUrl: string | null = userProfile?.avatar_url ?? null
  if (userProfile?.role === 'transporteur') {
    const { data: tp } = await supabase
      .from('transporteur_profiles')
      .select('verification_status')
      .eq('user_id', user.id)
      .single()
    verificationStatus = tp?.verification_status ?? null
  }

  return (
    <ProfileSettingsContent
      displayName={displayName}
      displayEmail={displayEmail}
      ville={userProfile?.ville ?? null}
      avgRating={avgRating}
      ratingsCount={ratingsCount}
      completed={completed}
      acceptanceRate={acceptanceRate}
      cancellationRate={cancellationRate}
      ratings={ratings ?? []}
      verificationStatus={verificationStatus}
      avatarUrl={avatarUrl}
      role={userProfile?.role === 'transporteur' || userProfile?.role === 'expéditeur' ? userProfile.role : undefined}
    />
  )
}
