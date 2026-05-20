import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div>
          <h1 className="text-4xl font-bold text-orange-600">FLEEZ TRUCK</h1>
          <p className="text-gray-600 mt-2">Transport intelligent au Maroc</p>
        </div>

        {/* Choix du rôle */}
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-800">Qui êtes-vous ?</p>

          <Link
            href="/auth/signup?role=transporteur"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition text-lg"
          >
            Je suis Transporteur
            <span className="block text-sm font-normal opacity-80 mt-1">
              J&apos;ai un camion, une remorque, ou les deux
            </span>
          </Link>

          <Link
            href="/auth/signup?role=expéditeur"
            className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl transition text-lg border-2 border-gray-200"
          >
            Je suis Expéditeur
            <span className="block text-sm font-normal text-gray-500 mt-1">
              J&apos;ai des marchandises à transporter
            </span>
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-orange-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
