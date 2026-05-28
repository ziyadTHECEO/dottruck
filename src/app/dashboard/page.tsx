import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Dottruck" width={32} height={32} />
          <Image src="/logo-text.png" alt="DOTTRUCK" width={110} height={22} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface text-muted transition-colors" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-muted hover:text-error transition-colors" aria-label="Deconnexion">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-24 max-w-lg mx-auto w-full space-y-6">
        <div>
          <p className="text-xl font-bold text-nardo">Salut, {userProfile?.nom?.split(' ')[0]}</p>
          <p className="text-sm text-muted mt-1">
            {isTransporteur
              ? `${charges.length} charge${charges.length !== 1 ? 's' : ''} disponible${charges.length !== 1 ? 's' : ''}`
              : `${charges.length} charge${charges.length !== 1 ? 's' : ''} publiee${charges.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {transporteurProfile && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
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
              className="flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-accent-hover transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Publier
            </Link>
          </div>
        )}

        {isTransporteur && charges.length > 0 && (
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Charges disponibles</p>
        )}

        {isTransporteur && !transporteurProfile ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-muted">Configurez votre profil pour voir les charges.</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors"
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
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <p className="text-muted text-sm">
              {isTransporteur
                ? 'Aucune charge disponible pour le moment.'
                : 'Aucune charge publiee. Cliquez sur "Publier" pour commencer.'}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
