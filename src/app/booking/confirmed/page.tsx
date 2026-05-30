import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookingConfirmedContent from '@/components/BookingConfirmedContent'

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ matchingId?: string }>
}) {
  const { matchingId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  let cargo = 'Charge'
  let route = '? → ?'
  let price = 0
  let partnerName = 'Partenaire'
  let partnerPhone = ''
  let partnerRating = 0

  if (matchingId) {
    const { data: matching } = await supabase
      .from('matchings')
      .select('*, charges(ville_depart, ville_arrivee, prix_total_mad, description, poids_kg)')
      .eq('id', matchingId)
      .single()

    if (matching) {
      const charge = matching.charges as unknown as {
        ville_depart: string
        ville_arrivee: string
        prix_total_mad: number
        description: string | null
        poids_kg: number | null
      } | null

      cargo = charge?.description ?? `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`
      route = `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`
      price = charge?.prix_total_mad ?? 0

      // Get partner info
      const partnerId = matching.transporteur_camion_id ?? matching.transporteur_remorque_id ?? matching.transporteur_complet_id
      if (partnerId && partnerId !== user.id) {
        const { data: partner } = await supabase
          .from('users')
          .select('nom, phone')
          .eq('id', partnerId)
          .single()

        if (partner) {
          partnerName = partner.nom ?? 'Partenaire'
          partnerPhone = partner.phone ?? ''
        }

        const { data: tp } = await supabase
          .from('transporteur_profiles')
          .select('score, type')
          .eq('user_id', partnerId)
          .maybeSingle()

        if (tp) {
          partnerRating = tp.score
          partnerName += tp.type === 'A' ? ' (Camion)' : tp.type === 'B' ? ' (Remorque)' : ' (Complet)'
        }
      }
    }
  }

  return (
    <BookingConfirmedContent
      cargo={cargo}
      route={route}
      price={price}
      partnerName={partnerName}
      partnerPhone={partnerPhone}
      partnerRating={partnerRating}
    />
  )
}
