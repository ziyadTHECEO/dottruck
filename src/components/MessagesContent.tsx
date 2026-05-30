'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

interface Conversation {
  id: string
  statut: string
  villeDepart: string
  villeArrivee: string
  prix: number
  lastMessage: string | null
  lastMessageTime: string
  isOwnMessage: boolean
  unreadCount: number
}

interface MessagesContentProps {
  conversations: Conversation[]
}

export default function MessagesContent({ conversations }: MessagesContentProps) {
  const { t } = useTranslation()

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return t('card_just_now')
    if (min < 60) return `${min}${t('card_minutes_ago')}`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}${t('card_hours_ago')}`
    const d = Math.floor(h / 24)
    if (d === 1) return t('card_yesterday')
    return `${d}${t('card_days_ago')}`
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title={t('messages_title')} />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-nardo font-semibold text-base">{t('messages_none')}</p>
            <p className="text-muted text-sm mt-1 text-center">
              {t('messages_none_desc')}
            </p>
            <Link
              href="/dashboard"
              className="mt-4 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {t('messages_view_charges')}
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
                        ? `${conv.isOwnMessage ? t('messages_you') : ''}${conv.lastMessage}`
                        : t('messages_no_message')}
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
