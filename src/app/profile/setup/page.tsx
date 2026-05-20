import Link from 'next/link'
import { setupTransporteurProfile } from '../actions'

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon véhicule</h1>
          <p className="text-gray-500 mt-1">Dites-nous ce que vous avez</p>
        </div>

        {params.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={setupTransporteurProfile} className="space-y-6">
          <div className="space-y-3">
            <p className="font-medium text-gray-700">Je possède :</p>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="C" className="mt-1" required />
              <div>
                <p className="font-semibold text-gray-800">Camion + Remorque</p>
                <p className="text-sm text-gray-500">J&apos;ai les deux, je peux accepter toute charge</p>
              </div>
            </label>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="A" className="mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Camion seulement</p>
                <p className="text-sm text-gray-500">Je cherche un partenaire avec une remorque</p>
              </div>
            </label>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="B" className="mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Remorque seulement</p>
                <p className="text-sm text-gray-500">Je cherche un partenaire avec un camion</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description du véhicule (optionnel)
            </label>
            <textarea
              name="description_vehicule"
              rows={3}
              placeholder="Ex: Camion Mercedes 15 tonnes, immatriculé Safi, disponible weekend..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Continuer
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          <Link href="/dashboard" className="text-orange-600 hover:underline">
            Passer cette étape
          </Link>
        </p>
      </div>
    </main>
  )
}
