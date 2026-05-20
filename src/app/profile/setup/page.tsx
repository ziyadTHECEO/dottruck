import Link from 'next/link'
import { setupTransporteurProfile } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

const vehicleOptions = [
  { value: 'C', label: 'Camion + Remorque', desc: "J'ai les deux, je peux accepter toute charge" },
  { value: 'A', label: 'Camion seul', desc: 'Je cherche un partenaire avec une remorque' },
  { value: 'B', label: 'Remorque seule', desc: 'Je cherche un partenaire avec un camion' },
]

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Ton profil" backHref="/dashboard" />

      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-nardo">Type de véhicule</h2>
          <p className="text-gray-500 mt-1 text-base">Dites-nous ce que vous avez</p>
        </div>

        {params.error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={setupTransporteurProfile} className="space-y-4">
          {vehicleOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-4 border-2 border-border rounded-xl p-4 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-all duration-200 bg-white"
            >
              <input type="radio" name="type" value={opt.value} required className="mt-0.5 accent-[#4A6FA5]" />
              <div>
                <p className="font-semibold text-nardo text-base">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}

          <div className="space-y-1 pt-2">
            <label className="block text-sm font-medium text-gray-600">
              Description du véhicule <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              name="description_vehicule"
              rows={3}
              placeholder="Ex: Mercedes 15T, Safi, disponible weekend..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
          >
            Continuer
          </button>
        </form>

        <p className="text-center">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-accent">
            Passer cette étape
          </Link>
        </p>
      </main>
    </div>
  )
}
