'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { verifyTransporteur } from '@/app/profile/actions'
import { createClient } from '@/lib/supabase/client'

// ── Admin Audio Recorder ─────────────────────────────────────────────────────

type RecordState = 'idle' | 'recording' | 'uploading' | 'ready' | 'error'

function AdminAudioRecorder({ onUrl }: { onUrl: (url: string | null) => void }) {
  const [state, setState] = useState<RecordState>('idle')
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const localUrl = URL.createObjectURL(blob)
        setAudioSrc(localUrl)

        try {
          const supabase = createClient()
          const filename = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`
          const { data, error } = await supabase.storage
            .from('voice-messages')
            .upload(filename, blob, { contentType: 'audio/webm', upsert: false })

          if (error || !data) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('voice-messages')
            .getPublicUrl(data.path)

          onUrl(publicUrl)
          setState('ready')
        } catch {
          setState('error')
          onUrl(null)
        }
      }

      recorder.start()
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setState('error')
    }
  }

  const stopRecording = () => {
    if (!mediaRef.current || mediaRef.current.state !== 'recording') return
    stopTimer()
    setState('uploading')
    mediaRef.current.stop()
  }

  const reset = () => {
    if (audioSrc) URL.revokeObjectURL(audioSrc)
    setAudioSrc(null)
    setSeconds(0)
    setState('idle')
    onUrl(null)
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <span className="text-xs font-medium text-amber-700">Message vocal (optionnel)</span>
      </div>

      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 min-h-[36px] rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" /></svg>
          Enregistrer un audio
        </button>
      )}

      {state === 'recording' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-600">{fmtTime(seconds)}</span>
            </div>
            <span className="text-[10px] text-muted">Enregistrement...</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 min-h-[36px] rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
            Arrêter
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
          Envoi en cours...
        </div>
      )}

      {(state === 'ready' || state === 'error') && (
        <div className="space-y-2">
          {state === 'ready' && audioSrc && (
            <audio src={audioSrc} controls className="w-full h-8" />
          )}
          {state === 'error' && (
            <p className="text-[10px] text-red-500 text-center">Erreur, réessayez</p>
          )}
          <div className="flex items-center justify-between">
            {state === 'ready' && <span className="text-[10px] text-success font-medium">Audio prêt</span>}
            <button type="button" onClick={reset} className="text-[10px] text-muted underline hover:text-nardo transition-colors ms-auto cursor-pointer">
              Réenregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface UserInfo {
  id: string
  nom: string
  email: string
  phone: string
  ville: string
  avatar_url: string | null
}

interface TransporteurProfile {
  id: string
  user_id: string
  vehicle_type: string | null
  photo_carte_grise: string | null
  photo_autorisation: string | null
  photo_vehicule: string | null
  verification_status: string
  rejection_reason: string | null
  users: UserInfo
}

interface Props {
  pendingProfiles: TransporteurProfile[]
  verifiedProfiles: TransporteurProfile[]
  rejectedProfiles?: TransporteurProfile[]
}

const VEHICLE_LABELS: Record<string, string> = {
  camion_seul: 'Camion',
  plateau_barres: 'Plateau barres',
  plateau: 'Plateau',
  frigorifique: 'Frigo',
  benne: 'Benne',
}

export default function AdminVerifyContent({ pendingProfiles, verifiedProfiles, rejectedProfiles = [] }: Props) {
  const [profiles, setProfiles] = useState(pendingProfiles)
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [resendId, setResendId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [resendNote, setResendNote] = useState('')
  const [resendAudioUrl, setResendAudioUrl] = useState<string | null>(null)
  const [resendFields, setResendFields] = useState<string[]>([])
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleVerify = async (userId: string) => {
    setLoading(userId)
    const result = await verifyTransporteur(userId, 'verified')
    if (result.success) {
      setProfiles(prev => prev.filter(p => p.user_id !== userId))
    }
    setLoading(null)
  }

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) return
    setLoading(userId)
    const result = await verifyTransporteur(userId, 'rejected', rejectReason)
    if (result.success) {
      setProfiles(prev => prev.filter(p => p.user_id !== userId))
      setRejectId(null)
      setRejectReason('')
    }
    setLoading(null)
  }

  const handleResend = async (userId: string) => {
    if (resendFields.length === 0) return
    setLoading(userId)
    const result = await verifyTransporteur(userId, 'resend', resendNote.trim() || undefined, resendAudioUrl || undefined, resendFields)
    if (result.success) {
      setProfiles(prev => prev.filter(p => p.user_id !== userId))
      setResendId(null)
      setResendNote('')
      setResendAudioUrl(null)
      setResendFields([])
    }
    setLoading(null)
  }

  const displayProfiles = tab === 'pending' ? profiles : tab === 'verified' ? verifiedProfiles : rejectedProfiles

  return (
    <div className="bg-surface flex flex-col">
      <main className="flex-1 pb-8 max-w-lg mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border-b border-border p-2">
          <button
            onClick={() => setTab('pending')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'pending' ? 'bg-accent text-white' : 'text-muted'
            }`}
          >
            En attente ({profiles.length})
          </button>
          <button
            onClick={() => setTab('verified')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'verified' ? 'bg-accent text-white' : 'text-muted'
            }`}
          >
            Vérifiés ({verifiedProfiles.length})
          </button>
          <button
            onClick={() => setTab('rejected')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'rejected' ? 'bg-accent text-white' : 'text-muted'
            }`}
          >
            Refusés ({rejectedProfiles.length})
          </button>
        </div>

        {displayProfiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted text-sm">
              {tab === 'pending' ? 'Aucun transporteur en attente' : tab === 'verified' ? 'Aucun transporteur vérifié' : 'Aucun transporteur refusé'}
            </p>
          </div>
        )}

        <div className="divide-y divide-border">
          {displayProfiles.map(profile => {
            const user = profile.users
            const isExpanded = expandedId === profile.id

            return (
              <div key={profile.id} className="bg-white">
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.nom} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-accent">{user.nom?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-nardo text-sm">{user.nom}</p>
                      {tab === 'pending' && (() => {
                        const missing = [profile.photo_carte_grise, profile.photo_autorisation, profile.photo_vehicule].filter(x => !x).length
                        return missing > 0 && missing < 3 ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-300">
                            Modification
                          </span>
                        ) : null
                      })()}
                    </div>
                    <p className="text-xs text-muted">{user.ville} — {VEHICLE_LABELS[profile.vehicle_type ?? ''] ?? profile.vehicle_type}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-muted">Téléphone</p>
                        <p className="text-nardo font-medium" dir="ltr">{user.phone}</p>
                      </div>
                      <div className="bg-surface rounded-lg p-2">
                        <p className="text-[10px] text-muted">Email</p>
                        <p className="text-nardo font-medium text-xs truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted">Documents</p>
                      <div className="grid grid-cols-3 gap-2">
                        {profile.photo_carte_grise && (
                          <a href={profile.photo_carte_grise} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={profile.photo_carte_grise} alt="Carte grise" className="w-full h-20 object-cover rounded-lg border border-border" />
                            <p className="text-[10px] text-muted text-center mt-1">Carte grise</p>
                          </a>
                        )}
                        {profile.photo_autorisation && (
                          <a href={profile.photo_autorisation} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={profile.photo_autorisation} alt="Autorisation" className="w-full h-20 object-cover rounded-lg border border-border" />
                            <p className="text-[10px] text-muted text-center mt-1">Autorisation</p>
                          </a>
                        )}
                        {profile.photo_vehicule && (
                          <a href={profile.photo_vehicule} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={profile.photo_vehicule} alt="Vehicule" className="w-full h-20 object-cover rounded-lg border border-border" />
                            <p className="text-[10px] text-muted text-center mt-1">Véhicule</p>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (only for pending) */}
                    {tab === 'pending' && (
                      <>
                        {rejectId === profile.user_id ? (
                          <div className="space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Motif du refus..."
                              rows={2}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(profile.user_id)}
                                disabled={loading === profile.user_id || !rejectReason.trim()}
                                className="flex-1 min-h-[40px] bg-error text-white text-sm font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                              >
                                Confirmer le refus
                              </button>
                              <button
                                onClick={() => { setRejectId(null); setRejectReason('') }}
                                className="px-4 min-h-[40px] border border-border text-muted text-sm rounded-lg cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : resendId === profile.user_id ? (
                          <div className="space-y-2">
                            {/* Field selector */}
                            <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2">
                              <p className="text-xs font-semibold text-amber-800">Document(s) à renvoyer :</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: 'photo_carte_grise', label: 'Carte grise' },
                                  { value: 'photo_autorisation', label: 'Autorisation' },
                                  { value: 'photo_vehicule', label: 'Photo véhicule' },
                                ].map(field => (
                                  <label key={field.value} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={resendFields.includes(field.value)}
                                      onChange={e => {
                                        if (e.target.checked) setResendFields(prev => [...prev, field.value])
                                        else setResendFields(prev => prev.filter(f => f !== field.value))
                                      }}
                                      className="w-4 h-4 rounded border-amber-300 accent-amber-500 cursor-pointer"
                                    />
                                    <span className="text-xs text-amber-900">{field.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <textarea
                              value={resendNote}
                              onChange={e => setResendNote(e.target.value)}
                              placeholder="Note pour le transporteur (optionnel) — ex: photo floue, carte grise illisible..."
                              rows={2}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
                            />
                            <AdminAudioRecorder onUrl={setResendAudioUrl} />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResend(profile.user_id)}
                                disabled={loading === profile.user_id || resendFields.length === 0}
                                className="flex-1 min-h-[40px] bg-amber-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                              >
                                Envoyer la demande
                              </button>
                              <button
                                onClick={() => { setResendId(null); setResendNote(''); setResendFields([]) }}
                                className="px-4 min-h-[40px] border border-border text-muted text-sm rounded-lg cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerify(profile.user_id)}
                                disabled={loading === profile.user_id}
                                className="flex-1 min-h-[44px] bg-success text-white text-sm font-semibold rounded-xl transition-colors hover:bg-success/90 disabled:opacity-50 cursor-pointer"
                              >
                                {loading === profile.user_id ? '...' : 'Vérifier ✓'}
                              </button>
                              <button
                                onClick={() => setRejectId(profile.user_id)}
                                disabled={loading === profile.user_id}
                                className="flex-1 min-h-[44px] bg-red-50 text-error text-sm font-semibold rounded-xl transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                              >
                                Refuser
                              </button>
                            </div>
                            <button
                              onClick={() => setResendId(profile.user_id)}
                              disabled={loading === profile.user_id}
                              className="w-full min-h-[40px] border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-xl transition-colors hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                            >
                              Renvoyer la requête ↩
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {tab === 'verified' && (
                      <div className="flex items-center gap-1.5 text-success text-xs font-semibold">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Transporteur vérifié
                      </div>
                    )}

                    {tab === 'rejected' && (
                      <div className="space-y-2">
                        {profile.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-error">
                            Motif : {profile.rejection_reason}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-error text-xs font-semibold">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          Transporteur refusé
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
