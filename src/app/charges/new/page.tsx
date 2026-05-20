import { TopHeader } from '@/components/ui/TopHeader'
import { publishCharge } from '../actions'

const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']

export default async function NewChargePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Publier une charge" backHref="/dashboard" />

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-10">
        {params.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mt-4">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={publishCharge} className="space-y-4 mt-4">

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Ville de départ</label>
            <select name="ville_depart" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">Choisir</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Ville d&apos;arrivée</label>
            <select name="ville_arrivee" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">Choisir</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Type de véhicule requis</label>
            <select name="type_requis" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">Choisir</option>
              <option value="camion">Camion</option>
              <option value="remorque">Remorque</option>
              <option value="les_deux">Camion + Remorque</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">
              Poids (kg) <span className="text-gray-400">— optionnel</span>
            </label>
            <input name="poids_kg" type="number" min="1" placeholder="Ex: 5000"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Prix total (MAD)</label>
            <input name="prix_total_mad" type="number" min="1" required placeholder="Ex: 1600"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">
              Description <span className="text-gray-400">— optionnel</span>
            </label>
            <textarea name="description" rows={3} placeholder="Ex: Sacs de ciment, chargement rapide..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base mt-2">
            Publier la charge
          </button>
        </form>
      </main>
    </div>
  )
}
