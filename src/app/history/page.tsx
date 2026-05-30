import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import HistoryContent from '@/components/HistoryContent'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  let historyItems: Array<{
    id: string
    cargo: string
    route: string
    price: number
    time: string
    rawDate: string
    status: 'success' | 'error' | 'warning' | 'pending'
    statut: string
  }> = []

  if (userProfile?.role === 'transporteur') {
    const { data: matchings } = await supabase
      .from('matchings')
      .select('id, statut, created_at, charges(ville_depart, ville_arrivee, prix_total_mad, description, poids_kg)')
      .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    historyItems = (matchings ?? []).map(m => {
      const charge = m.charges as unknown as {
        ville_depart: string
        ville_arrivee: string
        prix_total_mad: number
        description: string | null
        poids_kg: number | null
      } | null
      return {
        id: m.id,
        cargo: charge?.description ?? `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`,
        route: `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`,
        price: charge?.prix_total_mad ?? 0,
        time: '',
        rawDate: m.created_at,
        status: 'pending' as const,
        statut: m.statut,
      }
    })
  } else {
    const { data: charges } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    historyItems = (charges ?? []).map(c => {
      const statut = c.statut === 'completee' ? 'accepté' : c.statut === 'annulee' ? 'refusé' : c.statut === 'ouverte' ? 'proposé' : c.statut
      return {
        id: c.id,
        cargo: c.description ?? `${c.ville_depart} → ${c.ville_arrivee}`,
        route: `${c.ville_depart} → ${c.ville_arrivee}`,
        price: c.prix_total_mad,
        time: '',
        rawDate: c.created_at,
        status: 'pending' as const,
        statut,
      }
    })
  }

  const { blocked, resendFields } = await getVerificationState(user.id, userProfile?.role)

  return (
    <VerificationBlocker blocked={blocked} resendFields={resendFields}>
      <HistoryContent historyItems={historyItems} />
    </VerificationBlocker>
  )
}
