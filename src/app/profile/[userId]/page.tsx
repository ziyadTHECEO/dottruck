import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicProfileContent from '@/components/PublicProfileContent'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { userId } = await params

  // Fetch target user info
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, nom, ville, avatar_url')
    .eq('id', userId)
    .single()

  if (!targetUser) return notFound()

  // Fetch transporteur profile
  const { data: profile } = await supabase
    .from('transporteur_profiles')
    .select('type, vehicle_type, description_vehicule, score, capacite_tonnes, disponible, verification_status')
    .eq('user_id', userId)
    .single()

  // Fetch ratings
  const { data: ratings } = await supabase
    .from('ratings')
    .select('note, commentaire, created_at')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const ratingsCount = ratings?.length ?? 0
  const avgRating = ratingsCount > 0
    ? Math.round((ratings!.reduce((sum, r) => sum + r.note, 0) / ratingsCount) * 10) / 10
    : 0

  // Count completed matchings
  const { count: completedCount } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .or(`transporteur_camion_id.eq.${userId},transporteur_remorque_id.eq.${userId},transporteur_complet_id.eq.${userId}`)
    .in('statut', ['accepté', 'completé'])

  return (
    <PublicProfileContent
      targetUser={targetUser}
      profile={profile}
      avgRating={avgRating}
      ratingsCount={ratingsCount}
      ratings={ratings ?? []}
      completedCount={completedCount ?? 0}
      isOwnProfile={user.id === userId}
    />
  )
}
