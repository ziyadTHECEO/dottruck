import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full space-y-10">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-nardo tracking-tight">Dottruck</h1>
          <p className="text-gray-500 text-base">Transport intelligent au Maroc</p>
        </div>

        <div className="text-center space-y-3">
          <p className="text-3xl font-bold text-nardo leading-tight">
            Les appels,<br />c&apos;est fini.
          </p>
          <p className="text-gray-500 text-base">
            Trouve ton chargement en 2 clics
          </p>
        </div>

        <ul className="space-y-3 w-full">
          {[
            "Pas d'appels téléphoniques",
            'Transparent sur les prix',
            'Connexion directe',
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-gray-600 text-base">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="w-full space-y-3">
          <Link
            href="/auth/signup?role=transporteur"
            className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
          >
            Je suis Transporteur
          </Link>
          <Link
            href="/auth/signup?role=expéditeur"
            className="flex items-center justify-center w-full min-h-[52px] bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all duration-200 text-base"
          >
            Je suis Expéditeur
          </Link>
          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-accent font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
