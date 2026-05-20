interface Charge {
  id: string
  ville_depart: string
  ville_arrivee: string
  type_requis: string
  poids_kg: number | null
  prix_total_mad: number
  statut: string
  created_at: string
}

export function ChargeCard({ charge }: { charge: Charge }) {
  const typeLabel: Record<string, string> = {
    camion: 'Camion',
    remorque: 'Remorque',
    les_deux: 'Camion + Remorque',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 hover:border-orange-300 transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-900 text-lg">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {typeLabel[charge.type_requis] ?? charge.type_requis}
            {charge.poids_kg ? ` · ${charge.poids_kg} kg` : ''}
          </p>
        </div>
        <span className="text-orange-600 font-bold text-xl shrink-0">
          {charge.prix_total_mad} MAD
        </span>
      </div>
      <a
        href={`/charges/${charge.id}`}
        className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition"
      >
        Voir détails
      </a>
    </div>
  )
}
