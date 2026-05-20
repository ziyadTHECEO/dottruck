import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Détails de la charge</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            Erreur lors de la création du matching.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900">
              {charge.ville_depart} → {charge.ville_arrivee}
            </h2>
            <span className="text-2xl font-bold text-orange-600">{charge.prix_total_mad} MAD</span>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">Type :</span> {typeLabel[charge.type_requis]}</p>
            {charge.poids_kg && <p><span className="font-medium text-gray-800">Poids :</span> {charge.poids_kg} kg</p>}
            {charge.description && <p><span className="font-medium text-gray-800">Description :</span> {charge.description}</p>}
            <p><span className="font-medium text-gray-800">Commission Fleez (10%) :</span> {Math.round(charge.prix_total_mad * 0.1)} MAD</p>
            <p><span className="font-medium text-gray-800">Net transporteur(s) :</span> {charge.prix_total_mad - Math.round(charge.prix_total_mad * 0.1)} MAD</p>
          </div>
        </div>

        {/* Actions for transporteur */}
        {userProfile?.role === 'transporteur' && charge.statut === 'ouverte' && (
          <div>
            {existingMatching ? (
              <Link
                href={`/chat/${existingMatching.id}`}
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Continuer la négociation →
              </Link>
            ) : (
              <form action={createMatchingAction}>
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
                >
                  Je prends cette charge
                </button>
              </form>
            )}
          </div>
        )}

        {charge.statut !== 'ouverte' && (
          <p className="text-center text-gray-500 text-sm">Cette charge n&apos;est plus disponible.</p>
        )}
      </div>
    </main>
  )
}
