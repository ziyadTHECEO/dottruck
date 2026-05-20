import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { signOut } from '@/app/auth/actions'

const settingsItems = [
  { icon: '⚙️', label: 'Infos profil', href: '/profile/setup' },
  { icon: '🔔', label: 'Notifications', href: '/notifications' },
  { icon: '💳', label: 'Paiement', href: '#' },
  { icon: '🔐', label: 'Sécurité', href: '#' },
  { icon: '❓', label: 'Support', href: '#' },
  { icon: '📋', label: "Conditions d'utilisation", href: '#' },
]

const mockUser = {
  name: 'Hamza Ben Ali',
  email: 'hamza@example.com',
  rating: 4.8,
  reviews: 45,
  quote: 'Fiable et rapide',
  stats: { completed: 45, acceptance: '98%', cancellation: '2%' },
}

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Mon profil" backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Avatar + name */}
        <div className="bg-white px-4 py-6 flex flex-col items-center text-center border-b border-border">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-accent">{mockUser.name[0]}</span>
          </div>
          <h2 className="text-lg font-bold text-nardo">{mockUser.name}</h2>
          <p className="text-gray-400 text-sm">{mockUser.email}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400">★</span>
            <span className="font-semibold text-nardo text-sm">{mockUser.rating}</span>
            <span className="text-gray-400 text-sm">({mockUser.reviews} avis)</span>
          </div>
          <p className="text-sm text-gray-500 italic mt-1">&quot;{mockUser.quote}&quot;</p>
        </div>

        {/* Stats */}
        <div className="bg-white px-4 py-4 border-b border-border mt-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Mes stats</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-nardo">{mockUser.stats.completed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Complétées</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-xl font-bold text-success">{mockUser.stats.acceptance}</p>
              <p className="text-xs text-gray-500 mt-0.5">Acceptation</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-error">{mockUser.stats.cancellation}</p>
              <p className="text-xs text-gray-500 mt-0.5">Annulation</p>
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div className="bg-white mt-3 divide-y divide-border">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Paramètres</p>
          {settingsItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-base text-nardo font-medium">{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              className="w-full min-h-[48px] bg-white border border-error text-error font-semibold rounded-xl hover:bg-red-50 transition-all duration-200 text-base"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
