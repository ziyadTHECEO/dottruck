import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "A l'instant"
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Get all matchings the user is part of
  const { data: matchings } = await supabase
    .from('matchings')
    .select('id, statut, created_at, charges(ville_depart, ville_arrivee, prix_total_mad)')
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Also get matchings where user is the expediteur (via charges)
  const { data: expediteurCharges } = await supabase
    .from('charges')
    .select('id')
    .eq('expediteur_id', user.id)

  let expediteurMatchings: typeof matchings = []
  if (expediteurCharges && expediteurCharges.length > 0) {
    const chargeIds = expediteurCharges.map(c => c.id)
    const { data } = await supabase
      .from('matchings')
      .select('id, statut, created_at, charges(ville_depart, ville_arrivee, prix_total_mad)')
      .in('charge_id', chargeIds)
      .order('created_at', { ascending: false })
    expediteurMatchings = data ?? []
  }

  // Merge and deduplicate
  const allMatchings = [...(matchings ?? []), ...(expediteurMatchings ?? [])]
  const seen = new Set<string>()
  const uniqueMatchings = allMatchings.filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  // For each matching, get the last message
  const conversations = await Promise.all(
    uniqueMatchings.map(async (m) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('contenu, sender_id, created_at')
        .eq('matching_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('matching_id', m.id)
        .neq('sender_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const charge = m.charges as unknown as {
        ville_depart: string
        ville_arrivee: string
        prix_total_mad: number
      } | null

      return {
        id: m.id,
        statut: m.statut,
        villeDepart: charge?.ville_depart ?? '?',
        villeArrivee: charge?.ville_arrivee ?? '?',
        prix: charge?.prix_total_mad ?? 0,
        lastMessage: lastMsg?.contenu ?? null,
        lastMessageTime: lastMsg?.created_at ?? m.created_at,
        isOwnMessage: lastMsg?.sender_id === user.id,
        unreadCount: count ?? 0,
      }
    })
  )

  // Sort by last message time
  conversations.sort((a, b) =>
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  )

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Messages" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-nardo font-semibold text-base">Aucune conversation</p>
            <p className="text-muted text-sm mt-1 text-center">
              Acceptez une charge pour commencer a negocier
            </p>
            <Link
              href="/dashboard"
              className="mt-4 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Voir les charges
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-white transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-nardo' : 'font-semibold text-nardo'}`}>
                      {conv.villeDepart} → {conv.villeArrivee}
                    </p>
                    <span className="text-xs text-muted shrink-0">
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-nardo font-medium' : 'text-muted'}`}>
                      {conv.lastMessage
                        ? `${conv.isOwnMessage ? 'Vous: ' : ''}${conv.lastMessage}`
                        : 'Aucun message'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">{conv.prix.toLocaleString()} MAD</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
