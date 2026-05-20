import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'

async function createMatching(chargeId: string, userId: string) {
  'use server'
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matchings')
    .insert({
      charge_id: chargeId,
      transporteur_camion_id: userId,
      statut: 'proposé',
    })
    .select('id')
    .single()

  if (error || !data) return redirect(`/charges/${chargeId}?error=matching_failed`)
  return redirect(`/chat/${data.id}`)
}

export default async function ChargeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: charge } = await supabase
    .from('charges')
    .select('*')
    .eq('id', id)
    .single()

  if (!charge) return notFound()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check if user already has a matching for this charge
  const { data: existingMatching } = await supabase
    .from('matchings')
    .select('id')
    .eq('charge_id', id)
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .maybeSingle()

  const typeLabel: Record<string, string> = {
    camion: 'Camion seul',
    remorque: 'Remorque seule',
    les_deux: 'Camion + Remorque',
  }

  const createMatchingAction = createMatching.bind(null, id, user.id)

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Détails charge" backHref="/dashboard" />

      <main className="flex-1 pb-28 max-w-lg mx-auto w-full">
        {/* Hero */}
        <div className="bg-white px-4 py-5 border-b border-border">
          <h2 className="text-2xl font-bold text-nardo">
            {charge.description ?? `${charge.ville_depart} → ${charge.ville_arrivee}`}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm text-gray-500">Expéditeur fiable</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {/* Route */}
          <section className="bg-white px-4 py-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trajet</p>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                <span className="w-px h-8 bg-border my-1"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-nardo"></span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-nardo text-base">{charge.ville_depart}</p>
                  <p className="text-xs text-gray-400">Départ</p>
                </div>
                <div>
                  <p className="font-semibold text-nardo text-base">{charge.ville_arrivee}</p>
                  <p className="text-xs text-gray-400">Arrivée</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cargo info */}
          <section className="bg-white px-4 py-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Charge</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400">Poids</p>
                <p className="font-semibold text-nardo mt-0.5">
                  {charge.poids_kg ? `${charge.poids_kg} kg` : '—'}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-xs text-gray-400">Type requis</p>
                <p className="font-semibold text-nardo mt-0.5 capitalize">
                  {charge.type_requis.replace('_', ' ')}
                </p>
              </div>
            </div>
          </section>

          {/* Price */}
          <section className="bg-white px-4 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Prix proposé</p>
            <p className="text-3xl font-bold text-nardo mt-1">
              {charge.prix_total_mad.toLocaleString()}{' '}
              <span className="text-lg font-normal text-gray-500">MAD</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Négociable via le chat</p>
          </section>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <form action={createMatchingAction}>
            <input type="hidden" name="chargeId" value={charge.id} />
            <button
              type="submit"
              className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base"
            >
              Accepter cette charge
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
