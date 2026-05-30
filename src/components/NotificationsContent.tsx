'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'
import { AudioButton } from '@/components/ui/AudioButton'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { markAllNotificationsRead, markNotificationRead } from '@/app/notifications/actions'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  lue: boolean
  action_url: string | null
  audio_url: string | null
  created_at: string
}

interface NotificationsContentProps {
  notifs: Notification[]
  unreadCount: number
}

function NotifIcon({ type }: { type: string }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'nouvelle_charge': return <svg {...props}><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
    case 'message_recu': return <svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    case 'rating_recu': return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
    case 'matching_accepte': case 'charge_completee': return <svg {...props}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case 'matching_refuse': return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    case 'partenaire_trouve': return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    case 'verification_resend': return <svg {...props}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
    case 'verification_approved': return <svg {...props}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case 'verification_rejected': return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    default: return <svg {...props}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
  }
}

const iconColors: Record<string, string> = {
  nouvelle_charge: 'bg-blue-50 text-accent',
  message_recu: 'bg-purple-50 text-purple-600',
  rating_recu: 'bg-amber-50 text-warning',
  matching_accepte: 'bg-green-50 text-success',
  charge_completee: 'bg-green-50 text-success',
  matching_refuse: 'bg-red-50 text-error',
  partenaire_trouve: 'bg-blue-50 text-accent',
  verification_resend: 'bg-amber-50 text-amber-600',
  verification_approved: 'bg-green-50 text-success',
  verification_rejected: 'bg-red-50 text-error',
}

export default function NotificationsContent({ notifs, unreadCount }: NotificationsContentProps) {
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
      <TopHeader title={t('notifications_title')} backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        <div className="px-4 py-3 border-b border-border bg-white flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {unreadCount} {unreadCount !== 1 ? t('notifications_unread_plural') : t('notifications_unread')}
          </span>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="text-sm text-accent font-medium hover:underline cursor-pointer">
                {t('notifications_mark_all_read')}
              </button>
            </form>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <p className="text-nardo font-semibold text-base">{t('notifications_none')}</p>
            <p className="text-muted text-sm mt-1 text-center">
              {t('notifications_none_desc')}
            </p>
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-3 pb-4">
            {notifs.map((notif) => (
              <div
                key={notif.id}
                className={[
                  'bg-white rounded-xl border p-4 transition-all duration-200',
                  notif.lue ? 'border-border' : 'border-accent/20 shadow-sm',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconColors[notif.type] ?? 'bg-gray-50 text-muted'}`}>
                    <NotifIcon type={notif.type} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${notif.lue ? 'font-medium text-nardo/80' : 'font-semibold text-nardo'}`}>{notif.title}</p>
                        <p className="text-sm text-muted mt-0.5">{notif.body}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {!notif.lue && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                        <span className="text-xs text-muted">{timeAgo(notif.created_at)}</span>
                      </div>
                    </div>
                    {notif.audio_url && (
                      <div className="mt-2">
                        <audio src={notif.audio_url} controls className="w-full h-9" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {notif.action_url && (
                        <Link
                          href={notif.action_url}
                          className="inline-flex items-center justify-center min-h-[32px] px-3 bg-accent/5 text-accent text-xs font-semibold rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                        >
                          {t('notifications_view')}
                        </Link>
                      )}
                      {!notif.lue && (
                        <form action={markNotificationRead}>
                          <input type="hidden" name="id" value={notif.id} />
                          <button type="submit" className="inline-flex items-center justify-center min-h-[32px] px-3 bg-surface text-muted text-xs font-medium rounded-lg hover:bg-border/50 transition-colors cursor-pointer">
                            {t('notifications_mark_read')}
                          </button>
                        </form>
                      )}
                      <AudioButton text={`${notif.title}. ${notif.body}`} />
                    </div>
                  </div>
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
