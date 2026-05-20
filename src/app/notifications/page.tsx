import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import Link from 'next/link'

const mockNotifs = [
  {
    id: '1',
    icon: '🚛',
    title: 'Nouvelle charge disponible',
    body: 'Ciment 10T — 1 600 MAD',
    time: '11:30',
    unread: true,
    action: { label: 'Voir', href: '/dashboard' },
  },
  {
    id: '2',
    icon: '💬',
    title: 'Mohamed a répondu',
    body: '"D\'accord pour 1 600 MAD"',
    time: '10:45',
    unread: true,
    action: { label: 'Voir chat', href: '/dashboard' },
  },
  {
    id: '3',
    icon: '⭐',
    title: 'Vous avez reçu un avis 5 étoiles',
    body: '"Super transporteur, ponctuel!"',
    time: '09:20',
    unread: false,
    action: null,
  },
  {
    id: '4',
    icon: '✅',
    title: 'Charge complétée',
    body: 'Fruits 5T — Safi → Marrakech',
    time: 'Hier 16:00',
    unread: false,
    action: { label: 'Évaluer', href: '/dashboard' },
  },
]

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Notifications" backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        <div className="px-4 py-3 border-b border-border bg-white">
          <button className="text-sm text-accent font-medium hover:underline">
            Marquer tout comme lu
          </button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Non lus ({mockNotifs.filter(n => n.unread).length})
            </span>
          </div>
        </div>

        <div className="px-4 space-y-3 pb-4">
          {mockNotifs.map((notif) => (
            <div
              key={notif.id}
              className={[
                'bg-white rounded-xl border p-4 space-y-2 transition-all duration-200',
                notif.unread ? 'border-accent/30 shadow-sm' : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{notif.icon}</span>
                  <div>
                    <p className="font-semibold text-nardo text-sm">{notif.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {notif.unread && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                  <span className="text-xs text-gray-400">{notif.time}</span>
                </div>
              </div>
              {notif.action && (
                <Link
                  href={notif.action.href}
                  className="inline-flex items-center justify-center min-h-[36px] px-4 bg-surface border border-border text-nardo text-xs font-semibold rounded-lg hover:border-accent/40 transition-all"
                >
                  {notif.action.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
