import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import MessagesContent from '@/components/MessagesContent'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Get all matchings the user is part of
  const { data: matchings } = await supabase
    .from('matchings')
    .select('id, statut, created_at, charges(ville_depart, ville_arrivee, prix_total_mad)')
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Also get matchings where user is the expediteur (via charges)
  const { data: expediteurCharges } = await supabase
    .from('charges')
    .select('id')
    .eq('expediteur_id', user.id)

  let expediteurMatchings: typeof matchings = []
  if (expediteurCharges && expediteurCharges.length > 0) {
    const chargeIds = expediteurCharges.map(c => c.id)
    const { data } = await supabase
      .from('matchings')
      .select('id, statut, created_at, charges(ville_depart, ville_arrivee, prix_total_mad)')
      .in('charge_id', chargeIds)
      .order('created_at', { ascending: false })
    expediteurMatchings = data ?? []
  }

  // Merge and deduplicate
  const allMatchings = [...(matchings ?? []), ...(expediteurMatchings ?? [])]
  const seen = new Set<string>()
  const uniqueMatchings = allMatchings.filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  // For each matching, get the last message
  const conversations = await Promise.all(
    uniqueMatchings.map(async (m) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('contenu, sender_id, created_at')
        .eq('matching_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('matching_id', m.id)
        .neq('sender_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const charge = m.charges as unknown as {
        ville_depart: string
        ville_arrivee: string
        prix_total_mad: number
      } | null

      return {
        id: m.id,
        statut: m.statut,
        villeDepart: charge?.ville_depart ?? '?',
        villeArrivee: charge?.ville_arrivee ?? '?',
        prix: charge?.prix_total_mad ?? 0,
        lastMessage: lastMsg?.contenu ?? null,
        lastMessageTime: lastMsg?.created_at ?? m.created_at,
        isOwnMessage: lastMsg?.sender_id === user.id,
        unreadCount: count ?? 0,
      }
    })
  )

  // Sort by last message time
  conversations.sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  )

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { blocked, resendFields } = await getVerificationState(user.id, userRole?.role)

  return (
    <VerificationBlocker blocked={blocked} resendFields={resendFields}>
      <MessagesContent conversations={conversations} />
    </VerificationBlocker>
  )
}
