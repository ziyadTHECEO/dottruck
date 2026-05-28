import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-md mx-auto w-full">

        {/* Logo */}
        <div className="mb-14 flex flex-col items-center">
          <Image
            src="/logo-icon.png"
            alt="Dottruck"
            width={120}
            height={120}
            className="mb-5"
            priority
          />
          <p className="text-muted text-sm mt-3">Transport de fret au Maroc</p>
        </div>

        {/* Tagline */}
        <div className="text-center mb-10">
          <p className="text-2xl font-bold text-nardo leading-snug">
            Les appels,<br />c&apos;est fini.
          </p>
          <p className="text-muted text-base mt-2">
            Trouve ton chargement en 2 clics
          </p>
        </div>

        {/* Benefits */}
        <ul className="space-y-3 w-full mb-10">
          {[
            { text: "Pas d'appels", desc: 'Tout se fait via la plateforme' },
            { text: 'Prix transparents', desc: 'Voir le prix avant de postuler' },
            { text: 'Connexion directe', desc: 'Chat en temps réel' },
          ].map((benefit) => (
            <li key={benefit.text} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-nardo">{benefit.text}</p>
                <p className="text-xs text-muted">{benefit.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="w-full space-y-3">
          <Link
            href="/auth/signup?role=transporteur"
            className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors duration-200 text-base"
          >
            Je suis Transporteur
          </Link>
          <Link
            href="/auth/signup?role=exp%C3%A9diteur"
            className="flex items-center justify-center w-full min-h-[52px] bg-white border-2 border-border text-nardo font-semibold rounded-xl hover:border-accent/40 hover:bg-surface transition-colors duration-200 text-base"
          >
            Je suis Expediteur
          </Link>
          <p className="text-center text-sm text-muted pt-2">
            Deja un compte ?{' '}
            <Link href="/auth/login" className="text-accent font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
