import Link from 'next/link'
import { signUp } from '../actions'

const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>
}) {
  const params = await searchParams
  const role = params.role || 'transporteur'
  const error = params.error

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">
            Inscription en tant que{' '}
            <span className="font-semibold text-orange-600 capitalize">{role}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              name="nom" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <select
              name="ville" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choisir une ville</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              name="phone" type="tel" required placeholder="+212 6XX XXX XXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              name="password" type="password" required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-orange-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
