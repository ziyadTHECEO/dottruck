import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { StatusBadge } from '@/components/ui/StatusBadge'

const mockHistory = [
  {
    date: "Aujourd'hui",
    items: [
      { id: '1', cargo: 'Ciment 10T', route: 'Safi → Casa', price: 1600, time: '14:30', status: 'success' as const },
    ],
  },
  {
    date: 'Hier',
    items: [
      { id: '2', cargo: 'Fruits 5T', route: 'Safi → Marrakech', price: 1200, time: '09:15', status: 'success' as const },
      { id: '3', cargo: 'Électro 3T', route: 'Safi → Agadir', price: 900, time: '16:45', status: 'error' as const },
    ],
  },
  {
    date: 'Il y a 2 jours',
    items: [
      { id: '4', cargo: 'Ciment 8T', route: 'Safi → Rabat', price: 2100, time: '11:00', status: 'success' as const },
    ],
  },
]

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Historique" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 pt-4 space-y-5">
        <div>
          <select className="border border-border rounded-xl px-4 py-2.5 text-sm text-nardo bg-white focus:outline-none focus:border-accent transition-all">
            <option>Tous</option>
            <option>Acceptées</option>
            <option>Annulées</option>
          </select>
        </div>

        {mockHistory.map((group) => (
          <div key={group.date} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">📅 {group.date}</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {group.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between hover:border-accent/30 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-nardo text-sm truncate">{item.cargo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.route}</p>
                  <p className="text-xs font-bold text-nardo mt-1">{item.price.toLocaleString()} MAD</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <StatusBadge
                    status={item.status}
                    label={item.status === 'success' ? 'Complété' : 'Annulé'}
                  />
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        <button className="w-full text-center text-sm text-accent font-medium py-3 hover:underline">
          Charger plus
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
