import Link from 'next/link'
import { signUp } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>
}) {
  const params = await searchParams
  const role = params.role || 'transporteur'
  const error = params.error
  const isTransporteur = role === 'transporteur'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Inscription" backHref="/" />

      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-nardo">Qui êtes-vous ?</h2>
        </div>

        <div className="flex gap-2 bg-white border border-border rounded-xl p-1">
          <Link
            href="/auth/signup?role=transporteur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
              isTransporteur ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-nardo',
            ].join(' ')}
          >
            Transporteur
          </Link>
          <Link
            href="/auth/signup?role=expéditeur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
              !isTransporteur ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-nardo',
            ].join(' ')}
          >
            Expéditeur
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Nom complet</label>
            <input name="nom" type="text" required placeholder="Hamza Ben Ali"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Ville</label>
            <select name="ville" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">Choisir une ville</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Téléphone</label>
            <input name="phone" type="tel" required placeholder="+212 6XX XXX XXX"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input name="email" type="email" required placeholder="exemple@email.com"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
            <input name="password" type="password" required minLength={6} placeholder="••••••••"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base mt-2">
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center pb-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-accent font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </main>
    </div>
  )
}
