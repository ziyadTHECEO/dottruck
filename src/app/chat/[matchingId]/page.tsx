import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/ChatRoom'
import { TopHeader } from '@/components/ui/TopHeader'
import { getTranslation } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/constants'

async function cancelMatching(matchingId: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/auth/login')

  const { data: matching } = await supabase
    .from('matchings')
    .select('id, charge_id, statut, transporteur_camion_id, transporteur_remorque_id, transporteur_complet_id, charges(expediteur_id)')
    .eq('id', matchingId)
    .single()

  if (!matching) return redirect('/messages')

  // Only allow cancellation if user is part of this matching and statut is not already completé
  const charge = matching.charges as unknown as { expediteur_id: string } | null
  const transporteurId = matching.transporteur_complet_id ?? matching.transporteur_camion_id ?? matching.transporteur_remorque_id
  const isParticipant = user.id === transporteurId || user.id === charge?.expediteur_id

  if (!isParticipant || matching.statut === 'completé' || matching.statut === 'refusé') {
    return redirect(`/chat/${matchingId}`)
  }

  // Cancel the matching
  await supabase
    .from('matchings')
    .update({ statut: 'refusé' })
    .eq('id', matchingId)

  // Revert charge to ouverte
  await supabase
    .from('charges')
    .update({ statut: 'ouverte' })
    .eq('id', matching.charge_id)

  return redirect('/messages')
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchingId: string }>
}) {
  const { matchingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: matching } = await supabase
    .from('matchings')
    .select('*, charges(*)')
    .eq('id', matchingId)
    .single()

  if (!matching) return notFound()

  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'ar') as Language

  const charge = matching.charges as {
    id: string
    ville_depart: string
    ville_arrivee: string
    prix_total_mad: number
    expediteur_id: string
  }

  const transporteurId =
    matching.transporteur_complet_id ??
    matching.transporteur_camion_id ??
    matching.transporteur_remorque_id ?? null

  let transporteurName: string | undefined = undefined
  if (transporteurId && user.id === charge.expediteur_id) {
    const { data: tp } = await supabase
      .from('users')
      .select('nom')
      .eq('id', transporteurId)
      .single()
    transporteurName = tp?.nom ?? undefined
  }

  // Fetch price proposals for this matching
  const { data: proposals } = await supabase
    .from('price_proposals')
    .select('*')
    .eq('matching_id', matchingId)
    .order('created_at', { ascending: true })

  const canCancel = matching.statut !== 'completé' && matching.statut !== 'refusé'
  const cancelAction = cancelMatching.bind(null, matchingId)

  return (
    <div className="h-screen flex flex-col">
      <TopHeader title={getTranslation('chat_negotiation', lang)} backHref="/messages" />

      {canCancel && (
        <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted">{getTranslation('chat_negotiation', lang)}</span>
          <form action={cancelAction}>
            <button
              type="submit"
              className="text-xs text-error font-semibold px-3 py-1.5 border border-error/30 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </form>
        </div>
      )}

      <ChatRoom
        matchingId={matchingId}
        currentUserId={user.id}
        prixTotal={charge.prix_total_mad}
        transporteurName={transporteurName}
        initialProposals={proposals ?? []}
        matchingStatut={matching.statut}
      />
    </div>
  )
}
