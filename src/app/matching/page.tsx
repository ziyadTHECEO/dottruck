import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

const mockPartners = [
  { id: '1', name: "Mohamed's Remorque", capacity: 15, available: 'Maintenant', rating: 4.7, reviews: 34 },
  { id: '2', name: "Hassan's Remorque", capacity: 12, available: 'Demain matin', rating: 4.5, reviews: 21 },
  { id: '3', name: 'Rachid Transport', capacity: 20, available: 'Dans 2 jours', rating: 4.9, reviews: 67 },
]

export default function MatchingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Cherche partenaire" backHref="/dashboard" />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-5">
        <div>
          <h2 className="text-xl font-bold text-nardo">Vous avez un camion ?</h2>
          <p className="text-gray-500 text-sm mt-1">Trouvez une remorque disponible près de vous</p>
        </div>

        <div className="space-y-3">
          {mockPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/40 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-nardo text-base">{partner.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Capacité: {partner.capacity}T</p>
                  <p className="text-xs mt-1">
                    <span className={partner.available === 'Maintenant' ? 'text-success font-medium' : 'text-gray-400'}>
                      {partner.available === 'Maintenant' ? '● ' : '○ '}
                      {partner.available}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-nardo flex items-center gap-1 justify-end">
                    <span className="text-yellow-400">★</span> {partner.rating}
                  </p>
                  <p className="text-xs text-gray-400">{partner.reviews} avis</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 min-h-[44px] bg-white border border-border text-nardo text-sm font-semibold rounded-xl hover:bg-surface transition-all duration-200">
                  Voir profil
                </button>
                <button className="flex-1 min-h-[44px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all duration-200">
                  Contacter
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-accent font-medium cursor-pointer hover:underline">
          Voir plus de partenaires
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
