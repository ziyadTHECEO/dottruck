'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface UnreadChat {
  matchingId: string
  villeDepart: string
  villeArrivee: string
  count: number
}

export function NotificationBar({ userId }: { userId: string }) {
  const [unreadChats, setUnreadChats] = useState<UnreadChat[]>([])
  const supabase = createClient()

  const fetchUnread = async () => {
    // Get all matchings the user is part of
    const { data: matchings } = await supabase
      .from('matchings')
      .select('id, charges(ville_depart, ville_arrivee)')
      .or(`transporteur_camion_id.eq.${userId},transporteur_remorque_id.eq.${userId},transporteur_complet_id.eq.${userId}`)

    if (!matchings || matchings.length === 0) return

    // For each matching, count messages not from current user in last 24h
    const results: UnreadChat[] = []
    for (const m of matchings) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('matching_id', m.id)
        .neq('sender_id', userId)
        .gte('created_at', since)

      if (count && count > 0) {
        const charge = m.charges as { ville_depart: string; ville_arrivee: string } | null
        results.push({
          matchingId: m.id,
          villeDepart: charge?.ville_depart ?? '?',
          villeArrivee: charge?.ville_arrivee ?? '?',
          count,
        })
      }
    }
    setUnreadChats(results)
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 10000)
    return () => clearInterval(interval)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (unreadChats.length === 0) return null

  return (
    <div className="bg-accent text-white px-4 py-2">
      <div className="max-w-2xl mx-auto flex flex-wrap gap-3 items-center">
        <span className="text-sm font-semibold">Nouveaux messages :</span>
        {unreadChats.map(chat => (
          <Link
            key={chat.matchingId}
            href={`/chat/${chat.matchingId}`}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-sm transition text-white underline hover:no-underline"
          >
            <span>{chat.villeDepart} → {chat.villeArrivee}</span>
            <span className="bg-white text-accent text-xs font-bold rounded-full px-1.5">
              {chat.count > 9 ? '9+' : chat.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
