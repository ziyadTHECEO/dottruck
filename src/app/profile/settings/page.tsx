import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { signOut } from '@/app/auth/actions'

function SettingsIcon({ type }: { type: string }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'profile': return <svg {...props}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    case 'bell': return <svg {...props}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
    case 'card': return <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
    case 'lock': return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
    case 'help': return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    case 'file': return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    default: return null
  }
}

const settingsItems = [
  { iconType: 'profile', label: 'Infos profil', href: '/profile/setup' },
  { iconType: 'bell', label: 'Notifications', href: '/notifications' },
  { iconType: 'card', label: 'Paiement', href: '#' },
  { iconType: 'lock', label: 'Securite', href: '#' },
  { iconType: 'help', label: 'Support', href: '#' },
  { iconType: 'file', label: "Conditions d'utilisation", href: '#' },
]

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get ratings received
  const { data: ratings } = await supabase
    .from('ratings')
    .select('note, commentaire, created_at, from_user_id')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  const ratingsCount = ratings?.length ?? 0
  const avgRating = ratingsCount > 0
    ? Math.round((ratings!.reduce((sum, r) => sum + r.note, 0) / ratingsCount) * 10) / 10
    : 0

  // Get completed matchings count
  const { count: completedCount } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .in('statut', ['accepté', 'completé'])

  const { count: totalMatchings } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)

  const completed = completedCount ?? 0
  const total = totalMatchings ?? 0
  const acceptanceRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const cancellationRate = total > 0 ? 100 - acceptanceRate : 0

  const displayName = userProfile?.nom ?? user.user_metadata?.nom ?? 'Utilisateur'
  const displayEmail = userProfile?.email ?? user.email ?? ''

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Mon profil" backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Avatar + name */}
        <div className="bg-white px-4 py-8 flex flex-col items-center text-center border-b border-border">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-accent">{displayName[0]?.toUpperCase()}</span>
          </div>
          <h2 className="text-lg font-bold text-nardo">{displayName}</h2>
          <p className="text-muted text-sm mt-0.5">{displayEmail}</p>
          {userProfile?.ville && (
            <p className="text-muted text-xs mt-1">{userProfile.ville}</p>
          )}
          {ratingsCount > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-semibold text-nardo text-sm">{avgRating}</span>
              <span className="text-muted text-sm">({ratingsCount} avis)</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white px-4 py-5 border-b border-border mt-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Statistiques</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-nardo">{completed}</p>
              <p className="text-xs text-muted mt-1">Completees</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-2xl font-bold text-success">{acceptanceRate}%</p>
              <p className="text-xs text-muted mt-1">Acceptation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error">{cancellationRate}%</p>
              <p className="text-xs text-muted mt-1">Annulation</p>
            </div>
          </div>
        </div>

        {/* Recent ratings */}
        {ratings && ratings.length > 0 && (
          <div className="bg-white px-4 py-5 border-b border-border mt-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Derniers avis</p>
            <div className="space-y-3">
              {ratings.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= r.note ? '#D97706' : '#E2E8F0'} stroke={s <= r.note ? '#D97706' : '#E2E8F0'} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  {r.commentaire && (
                    <p className="text-sm text-muted">&quot;{r.commentaire}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings list */}
        <div className="bg-white mt-2 divide-y divide-border">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">Parametres</p>
          {settingsItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 hover:bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted">
                  <SettingsIcon type={item.iconType} />
                </span>
                <span className="text-sm text-nardo font-medium">{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/50">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 mt-6 pb-6">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full min-h-[48px] bg-white border border-error/30 text-error font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm cursor-pointer"
            >
              Deconnexion
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
