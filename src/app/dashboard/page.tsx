import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChargeCard } from '@/components/ChargeCard'
import { signOut } from '@/app/auth/actions'
import { getVisibleChargeTypes } from '@/lib/matching'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, transporteur_profiles(*)')
    .eq('id', user.id)
    .single()

  const transporteurProfile = userProfile?.transporteur_profiles as {
    type: 'A' | 'B' | 'C'
    description_vehicule: string | null
    score: number
  } | null

  // Build charge query based on user role
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
    // Expéditeur sees their own charges
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
    charges = data ?? []
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-600">FLEEZ TRUCK</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{userProfile?.nom}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-red-500 transition">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Transporteur banner */}
        {transporteurProfile && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            {transporteurProfile.type === 'A' && (
              <div>
                <p className="font-semibold text-orange-800">Vous avez un camion</p>
                <p className="text-sm text-orange-600 mt-1">
                  Vous voyez les charges qui nécessitent un camion ou camion + remorque
                </p>
              </div>
            )}
            {transporteurProfile.type === 'B' && (
              <div>
                <p className="font-semibold text-orange-800">Vous avez une remorque</p>
                <p className="text-sm text-orange-600 mt-1">
                  Vous voyez les charges qui nécessitent une remorque ou camion + remorque
                </p>
              </div>
            )}
            {transporteurProfile.type === 'C' && (
              <p className="font-semibold text-orange-800">
                Camion + Remorque — vous voyez toutes les charges disponibles
              </p>
            )}
          </div>
        )}

        {/* Expéditeur actions */}
        {userProfile?.role === 'expéditeur' && (
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Mes charges</h2>
            <a
              href="/charges/new"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
            >
              + Publier une charge
            </a>
          </div>
        )}

        {/* Charge list */}
        {userProfile?.role === 'transporteur' && (
          <h2 className="text-lg font-semibold text-gray-800">
            Charges disponibles ({charges.length})
          </h2>
        )}

        {charges.length > 0 ? (
          <div className="space-y-3">
            {charges.map(charge => (
              <ChargeCard key={charge.id} charge={charge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {userProfile?.role === 'expéditeur'
              ? 'Aucune charge publiée. Cliquez sur "+ Publier une charge" pour commencer.'
              : 'Aucune charge disponible pour le moment.'}
          </div>
        )}
      </div>
    </main>
  )
}
