import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { StatusBadge } from '@/components/ui/StatusBadge'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "A l'instant"
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 0) return "Aujourd'hui"
  if (d === 1) return 'Hier'
  return `Il y a ${d}j`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

type StatusType = 'success' | 'error' | 'warning' | 'pending'

function mapStatut(statut: string): { status: StatusType; label: string } {
  switch (statut) {
    case 'accepté': case 'completé': return { status: 'success', label: 'Complete' }
    case 'refusé': case 'annulee': return { status: 'error', label: 'Annule' }
    case 'en_cours': case 'proposé': case 'en_négociation': return { status: 'pending', label: 'En cours' }
    default: return { status: 'warning', label: statut }
  }
}

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
    date: string
    status: StatusType
    statusLabel: string
  }> = []

  if (userProfile?.role === 'transporteur') {
    // Get matchings for this transporteur
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
      const { status, label } = mapStatut(m.statut)
      return {
        id: m.id,
        cargo: charge?.description ?? `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`,
        route: `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`,
        price: charge?.prix_total_mad ?? 0,
        time: formatTime(m.created_at),
        date: timeAgo(m.created_at),
        status,
        statusLabel: label,
      }
    })
  } else {
    // Expediteur: show their charges
    const { data: charges } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    historyItems = (charges ?? []).map(c => {
      const statut = c.statut === 'completee' ? 'accepté' : c.statut === 'annulee' ? 'refusé' : c.statut === 'ouverte' ? 'proposé' : c.statut
      const { status, label } = mapStatut(statut)
      return {
        id: c.id,
        cargo: c.description ?? `${c.ville_depart} → ${c.ville_arrivee}`,
        route: `${c.ville_depart} → ${c.ville_arrivee}`,
        price: c.prix_total_mad,
        time: formatTime(c.created_at),
        date: timeAgo(c.created_at),
        status,
        statusLabel: label,
      }
    })
  }

  // Group by date
  const grouped = new Map<string, typeof historyItems>()
  for (const item of historyItems) {
    const existing = grouped.get(item.date) ?? []
    existing.push(item)
    grouped.set(item.date, existing)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Historique" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 pt-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Vos charges</p>
        </div>

        {historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-muted text-sm">Aucun historique pour le moment</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-xs text-muted font-medium">{date}</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-border px-4 py-3.5 flex items-center justify-between hover:border-accent/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-nardo text-sm truncate">{item.cargo}</p>
                    <p className="text-xs text-muted mt-0.5">{item.route}</p>
                    <p className="text-sm font-bold text-nardo mt-1.5">{item.price.toLocaleString()} MAD</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                    <StatusBadge status={item.status} label={item.statusLabel} />
                    <p className="text-xs text-muted">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
