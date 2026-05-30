'use client'

import { useState } from 'react'
import { banUser, unbanUser } from '@/app/admin/actions'

interface User {
  id: string
  nom: string
  email: string
  ville: string | null
  role: string
  banned: boolean
  ban_reason: string | null
  avatar_url: string | null
  created_at: string
  charges_count: number
  matchings_count: number
}

interface Props {
  users: User[]
}

export default function UsersContent({ users: initial }: Props) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [banModal, setBanModal] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = users.filter(u => {
    if (search && !u.nom.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  const handleBan = async (userId: string) => {
    if (!banReason.trim()) return
    setLoading(userId)
    const result = await banUser(userId, banReason)
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true, ban_reason: banReason } : u))
      setBanModal(null)
      setBanReason('')
    }
    setLoading(null)
  }

  const handleUnban = async (userId: string) => {
    setLoading(userId)
    const result = await unbanUser(userId)
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false, ban_reason: null } : u))
    }
    setLoading(null)
  }

  return (
    <div>
      {/* Search + filters */}
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
        />
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'transporteur', label: 'Transporteurs' },
            { key: 'expéditeur', label: 'Expéditeurs' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                roleFilter === f.key ? 'bg-accent text-white' : 'bg-white text-muted border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">Aucun utilisateur</p>
        )}
        {filtered.map(user => (
          <div key={user.id} className="bg-white rounded-xl border border-border">
            {/* User row */}
            <button
              onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nom} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-accent">{user.nom?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-nardo text-sm">{user.nom}</p>
                  {user.banned && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-error text-[10px] font-medium border border-red-200">
                      Suspendu
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">{user.email} — {user.role === 'transporteur' ? 'Transporteur' : 'Expéditeur'} — {user.ville ?? '—'}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-muted transition-transform ${expandedId === user.id ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded */}
            {expandedId === user.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{user.charges_count}</p>
                    <p className="text-muted">Charges</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{user.matchings_count}</p>
                    <p className="text-muted">Transactions</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{new Date(user.created_at).toLocaleDateString('fr-MA')}</p>
                    <p className="text-muted">Inscription</p>
                  </div>
                </div>

                {user.banned && user.ban_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-error">
                    Motif : {user.ban_reason}
                  </div>
                )}

                {/* Ban modal */}
                {banModal === user.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={banReason}
                      onChange={e => setBanReason(e.target.value)}
                      placeholder="Motif de suspension..."
                      rows={2}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBan(user.id)}
                        disabled={loading === user.id || !banReason.trim()}
                        className="flex-1 min-h-[36px] bg-error text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => { setBanModal(null); setBanReason('') }}
                        className="px-4 min-h-[36px] border border-border text-muted text-xs rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {user.banned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        disabled={loading === user.id}
                        className="flex-1 min-h-[36px] bg-success text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {loading === user.id ? '...' : 'Réactiver'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setBanModal(user.id)}
                        className="flex-1 min-h-[36px] bg-red-50 text-error text-xs font-semibold rounded-lg border border-red-200 cursor-pointer"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
