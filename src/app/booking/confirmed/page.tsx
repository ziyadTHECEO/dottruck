import Link from 'next/link'

export default function BookingConfirmedPage() {
  const mock = {
    cargo: 'Ciment 10T',
    route: 'Safi → Casa',
    price: 1600,
    partner: 'Mohamed (Remorque)',
    rating: 4.7,
    departure: "Aujourd'hui 14h",
    phone: '+212 6 XX XX XX XX',
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start px-6 pt-16 pb-10">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-nardo text-center">Charge acceptée !</h1>
          <p className="text-gray-500 text-base text-center mt-1">Votre charge est confirmée</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Résumé</p>
          {[
            { label: 'Charge', value: mock.cargo },
            { label: 'Trajet', value: mock.route },
            { label: 'Prix', value: `${mock.price.toLocaleString()} MAD` },
            { label: 'Départ', value: mock.departure },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">{label}</span>
              <span className="font-semibold text-nardo text-sm">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Partenaire</span>
            <div className="text-right">
              <p className="font-semibold text-nardo text-sm">{mock.partner}</p>
              <p className="text-xs text-gray-400">★ {mock.rating}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-border p-5 mt-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact partenaire</p>
          <p className="font-semibold text-nardo">{mock.phone}</p>
          <div className="flex gap-2">
            <a href={`tel:${mock.phone}`}
              className="flex-1 min-h-[48px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all text-sm">
              Appeler
            </a>
            <a href={`sms:${mock.phone}`}
              className="flex-1 min-h-[48px] flex items-center justify-center bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all text-sm">
              SMS
            </a>
          </div>
        </div>

        {/* Nav actions */}
        <div className="flex gap-3 mt-6">
          <Link href="/history"
            className="flex-1 min-h-[48px] flex items-center justify-center bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all text-sm">
            Historique
          </Link>
          <Link href="/dashboard"
            className="flex-1 min-h-[48px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all text-sm">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
