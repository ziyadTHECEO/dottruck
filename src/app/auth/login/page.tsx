import Link from 'next/link'
import { signIn } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Connexion" backHref="/" />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-nardo">Bienvenue</h2>
            <p className="text-gray-500 mt-1 text-base">Connectez-vous à votre compte Dottruck</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                name="email" type="email" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]"
                placeholder="exemple@email.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                name="password" type="password" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
            >
              Se connecter
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center">
            Pas encore de compte ?{' '}
            <Link href="/" className="text-accent font-medium hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
