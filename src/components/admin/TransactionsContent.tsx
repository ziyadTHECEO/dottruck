'use client'

import { useState } from 'react'
import Link from 'next/link'
import { markAsPaid } from '@/app/admin/actions'

interface Matching {
  id: string
  statut: string
  prix_final: number | null
  paid: boolean
  created_at: string
  charge: {
    ville_depart: string
    ville_arrivee: string
  } | null
  transporteur_nom: string | null
}

interface Props {
  matchings: Matching[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'proposé': { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'en_négociation': { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'accepté': { label: 'Confirmé', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'completé': { label: 'Terminé', color: 'bg-green-50 text-success border-green-200' },
  'refusé': { label: 'Refusé', color: 'bg-red-50 text-error border-red-200' },
}

export default function TransactionsContent({ matchings: initial }: Props) {
  const [matchings, setMatchings] = useState(initial)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? matchings
    : matchings.filter(m => {
        if (filter === 'in_progress') return ['proposé', 'en_négociation'].includes(m.statut)
        if (filter === 'confirmed') return m.statut === 'accepté'
        if (filter === 'completed') return m.statut === 'completé'
        if (filter === 'refused') return m.statut === 'refusé'
        return true
      })

  const handleMarkPaid = async (id: string) => {
    setLoading(id)
    const result = await markAsPaid(id)
    if (result.success) {
      setMatchings(prev => prev.map(m => m.id === id ? { ...m, paid: true } : m))
    }
    setLoading(null)
  }

  const FILTERS = [
    { key: 'all', label: 'Tout' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'confirmed', label: 'Confirmé' },
    { key: 'completed', label: 'Terminé' },
    { key: 'refused', label: 'Refusé' },
  ]

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-1.5 p-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
              filter === f.key ? 'bg-accent text-white' : 'bg-white text-muted border border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">Aucune transaction</p>
        )}
        {filtered.map(m => {
          const status = STATUS_MAP[m.statut] ?? STATUS_MAP['proposé']
          const commission = m.prix_final ? Math.round(m.prix_final * 0.04) : 0
          const date = new Date(m.created_at).toLocaleDateString('fr-MA')

          return (
            <div key={m.id} className="bg-white rounded-xl border border-border p-4 space-y-3">
              {/* Route */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-nardo">
                  {m.charge?.ville_depart ?? '—'} → {m.charge?.ville_arrivee ?? '—'}
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">Transporteur</p>
                  <p className="text-nardo font-medium">{m.transporteur_nom ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted">Date</p>
                  <p className="text-nardo font-medium">{date}</p>
                </div>
                {m.prix_final && (
                  <>
                    <div>
                      <p className="text-muted">Prix final</p>
                      <p className="text-nardo font-medium">{m.prix_final} MAD</p>
                    </div>
                    <div>
                      <p className="text-muted">Commission 4%</p>
                      <p className="text-success font-medium">{commission} MAD</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {m.statut === 'completé' && !m.paid && (
                  <button
                    onClick={() => handleMarkPaid(m.id)}
                    disabled={loading === m.id}
                    className="flex-1 min-h-[36px] bg-success text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading === m.id ? '...' : 'Payé ✓'}
                  </button>
                )}
                {m.paid && (
                  <span className="flex-1 min-h-[36px] flex items-center justify-center bg-green-50 text-success text-xs font-semibold rounded-lg border border-green-200">
                    Payé ✓
                  </span>
                )}
                <Link
                  href={`/chat/${m.id}`}
                  className="px-4 min-h-[36px] flex items-center border border-border text-muted text-xs rounded-lg hover:bg-surface"
                >
                  Voir le chat
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
