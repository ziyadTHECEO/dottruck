import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function MatchingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Get current user's transporteur profile
  const { data: myProfile } = await supabase
    .from('transporteur_profiles')
    .select('type')
    .eq('user_id', user.id)
    .maybeSingle()

  // Determine what type of partners to show
  // Type A (camion) needs type B (remorque) partners
  // Type B (remorque) needs type A (camion) partners
  const lookingForType = myProfile?.type === 'A' ? 'B' : myProfile?.type === 'B' ? 'A' : null
  const lookingForLabel = myProfile?.type === 'A' ? 'Remorques disponibles' : myProfile?.type === 'B' ? 'Camions disponibles' : 'Partenaires disponibles'

  // Fetch available partners
  let partners: Array<{
    user_id: string
    type: string
    description_vehicule: string | null
    score: number
    capacite_tonnes: number | null
    disponible: boolean
    nom: string
    ville: string | null
    ratingsCount: number
  }> = []

  if (lookingForType) {
    const { data: profiles } = await supabase
      .from('transporteur_profiles')
      .select('user_id, type, description_vehicule, score, capacite_tonnes, disponible')
      .eq('type', lookingForType)
      .eq('disponible', true)
      .neq('user_id', user.id)

    if (profiles && profiles.length > 0) {
      // Fetch user names for each partner
      const userIds = profiles.map(p => p.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, nom, ville')
        .in('id', userIds)

      const usersMap = new Map((users ?? []).map(u => [u.id, u]))

      // Get ratings counts
      partners = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('ratings')
            .select('*', { count: 'exact', head: true })
            .eq('to_user_id', p.user_id)

          const userInfo = usersMap.get(p.user_id)
          return {
            ...p,
            nom: userInfo?.nom ?? 'Transporteur',
            ville: userInfo?.ville ?? null,
            ratingsCount: count ?? 0,
          }
        })
      )
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Partenaires" backHref="/dashboard" />

      <main className="flex-1 px-4 pt-6 pb-24 max-w-lg mx-auto w-full space-y-6">
        <div>
          <h2 className="text-lg font-bold text-nardo">Trouvez un partenaire</h2>
          <p className="text-muted text-sm mt-1">{lookingForLabel} pres de vous</p>
        </div>

        {!myProfile ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-muted text-sm">Configurez votre profil transporteur pour trouver des partenaires</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors"
            >
              Configurer mon profil
            </Link>
          </div>
        ) : myProfile.type === 'C' ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-nardo font-semibold">Vous avez camion + remorque</p>
            <p className="text-muted text-sm">Vous n&apos;avez pas besoin de partenaire. Toutes les charges vous sont accessibles.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center min-h-[44px] px-5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Voir les charges
            </Link>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-muted text-sm">Aucun partenaire disponible pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.user_id} className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-nardo text-sm">{partner.nom}</p>
                    {partner.ville && (
                      <p className="text-xs text-muted mt-0.5">{partner.ville}</p>
                    )}
                    {partner.description_vehicule && (
                      <p className="text-xs text-muted mt-1">{partner.description_vehicule}</p>
                    )}
                    {partner.capacite_tonnes && (
                      <p className="text-xs text-muted mt-0.5">Capacite: {partner.capacite_tonnes}T</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      <span className="text-xs text-success font-medium">Disponible</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {partner.score > 0 && (
                      <>
                        <div className="flex items-center gap-1 justify-end">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span className="text-sm font-semibold text-nardo">{partner.score}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{partner.ratingsCount} avis</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/dashboard"
                    className="flex-1 min-h-[44px] flex items-center justify-center bg-white border border-border text-nardo text-sm font-semibold rounded-xl hover:bg-surface transition-colors cursor-pointer"
                  >
                    Voir profil
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex-1 min-h-[44px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Contacter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
