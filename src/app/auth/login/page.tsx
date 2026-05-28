import Link from 'next/link'
import Image from 'next/image'
import { signIn } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <Link href="/" className="mb-6">
              <Image src="/logo-icon.png" alt="Dottruck" width={72} height={72} priority />
            </Link>
            <h2 className="text-2xl font-bold text-nardo">Bienvenue</h2>
            <p className="text-muted mt-1 text-sm">Connectez-vous a votre compte Dottruck</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-nardo">Email</label>
              <input
                name="email" type="email" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]"
                placeholder="exemple@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-nardo">Mot de passe</label>
              <input
                name="password" type="password" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base cursor-pointer"
            >
              Se connecter
            </button>
          </form>

          <p className="text-sm text-muted text-center">
            Pas encore de compte ?{' '}
            <Link href="/" className="text-accent font-semibold hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
