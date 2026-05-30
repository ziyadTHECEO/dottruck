'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/stats', label: 'Statistiques', icon: 'stats' },
  { href: '/admin/transporteurs', label: 'Transporteurs', icon: 'truck' },
  { href: '/admin/transactions', label: 'Transactions', icon: 'money' },
  { href: '/admin/users', label: 'Utilisateurs', icon: 'users' },
]

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? 'currentColor' : '#9CA3AF'
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'stats': return <svg {...props}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
    case 'truck': return <svg {...props}><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
    case 'money': return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    default: return null
  }
}

export default function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-border">
      <div className="flex max-w-4xl mx-auto">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-nardo'
              }`}
            >
              <TabIcon type={tab.icon} active={active} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
