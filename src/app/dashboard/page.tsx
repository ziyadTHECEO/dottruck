import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChargeCard } from '@/components/ChargeCard'
import { NotificationBar } from '@/components/NotificationBar'
import { signOut } from '@/app/auth/actions'
import { getVisibleChargeTypes } from '@/lib/matching'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, transporteur_profiles(*)')
    .eq('id', user.id)
    .single()

  const rawProfiles = userProfile?.transporteur_profiles
  const transporteurProfile = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as {
    type: 'A' | 'B' | 'C'
    description_vehicule: string | null
    score: number
  } | null | undefined ?? null

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
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
    charges = data ?? []
  }

  const isTransporteur = userProfile?.role === 'transporteur'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <NotificationBar userId={user.id} />

      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-nardo">Dottruck</h1>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface text-gray-500 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-error transition-colors font-medium">
              Déco
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-5">
        <div>
          <p className="text-lg font-bold text-nardo">Salut, {userProfile?.nom?.split(' ')[0]} 👋</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTransporteur
              ? `${charges.length} charge${charges.length !== 1 ? 's' : ''} disponible${charges.length !== 1 ? 's' : ''}`
              : `${charges.length} charge${charges.length !== 1 ? 's' : ''} publiée${charges.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {transporteurProfile && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <p className="text-sm font-medium text-accent">
              {transporteurProfile.type === 'A' && "Camion seul — cherchez une remorque via l'onglet Matching"}
              {transporteurProfile.type === 'B' && "Remorque seule — cherchez un camion via l'onglet Matching"}
              {transporteurProfile.type === 'C' && 'Camion + Remorque — toutes les charges sont visibles'}
            </p>
          </div>
        )}

        {!isTransporteur && (
          <div className="flex justify-between items-center">
            <p className="text-base font-bold text-nardo">Mes charges</p>
            <Link
              href="/charges/new"
              className="flex items-center gap-1 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent-hover transition-all"
            >
              + Publier
            </Link>
          </div>
        )}

        {isTransporteur && charges.length > 0 && (
          <p className="text-sm font-bold text-nardo uppercase tracking-wide">Charges près de toi</p>
        )}

        {isTransporteur && !transporteurProfile ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-500">Configurez votre profil pour voir les charges.</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent text-white font-semibold rounded-xl"
            >
              Configurer mon profil
            </Link>
          </div>
        ) : charges.length > 0 ? (
          <div className="space-y-3">
            {charges.map(charge => (
              <ChargeCard key={charge.id} charge={charge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            {isTransporteur
              ? 'Aucune charge disponible pour le moment.'
              : 'Aucune charge publiée. Cliquez sur "+ Publier" pour commencer.'}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
