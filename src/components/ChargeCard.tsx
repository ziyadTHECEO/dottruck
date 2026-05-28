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
  if (h < 1) return "A l'instant"
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export function ChargeCard({ charge }: { charge: Charge }) {
  return (
    <a href={`/charges/${charge.id}`} className="block bg-white rounded-xl border border-border p-4 hover:border-accent/30 transition-colors cursor-pointer">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <p className="font-semibold text-nardo text-sm truncate">
              {charge.ville_depart} → {charge.ville_arrivee}
            </p>
          </div>
          <p className="text-xs text-muted mt-1.5 ml-6">
            {typeLabel[charge.type_requis] ?? charge.type_requis}
            {charge.poids_kg ? ` · ${charge.poids_kg} kg` : ''}
          </p>
          <p className="text-xs text-muted/60 mt-1 ml-6">{timeAgo(charge.created_at)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-nardo text-lg leading-tight">{charge.prix_total_mad.toLocaleString()}</p>
          <p className="text-xs text-muted">MAD</p>
        </div>
      </div>
    </a>
  )
}
