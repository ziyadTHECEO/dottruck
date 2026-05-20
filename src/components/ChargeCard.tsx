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

const typeLabel: Record<string, string> = {
  camion: 'Camion',
  remorque: 'Remorque',
  les_deux: 'Camion + Remorque',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "À l'instant"
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export function ChargeCard({ charge }: { charge: Charge }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/50 transition-all duration-200 hover:shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-nardo text-base truncate">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {typeLabel[charge.type_requis] ?? charge.type_requis}
            {charge.poids_kg ? ` · ${charge.poids_kg} kg` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(charge.created_at)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-nardo text-lg">{charge.prix_total_mad.toLocaleString()}</p>
          <p className="text-xs text-gray-500">MAD</p>
        </div>
      </div>
      <a
        href={`/charges/${charge.id}`}
        className="flex items-center justify-center w-full min-h-[44px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm"
      >
        Accepter
      </a>
    </div>
  )
}
