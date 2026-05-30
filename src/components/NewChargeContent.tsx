'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopHeader } from '@/components/ui/TopHeader'
import { useTranslation } from '@/lib/i18n/context'
import { publishCharge } from '@/app/charges/actions'
import { CITIES_AR } from '@/lib/i18n/translations'
import { createClient } from '@/lib/supabase/client'

// ── Audio Recorder ────────────────────────────────────────────────────────────

type RecordState = 'idle' | 'recording' | 'uploading' | 'ready' | 'error'

function AudioRecorder({ onUrl }: { onUrl: (url: string | null) => void }) {
  const { t } = useTranslation()
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
          const filename = `charges/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`
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
    setState('uploading') // immediate feedback — don't wait for onstop
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
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-medium text-nardo">{t('charges_audio_title')}</p>
          <p className="text-xs text-muted mt-0.5">{t('charges_audio_hint')}</p>
        </div>
      </div>

      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-accent/40 text-accent text-sm font-medium hover:bg-accent/5 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="6" r="6" />
          </svg>
          {t('charges_audio_record')}
        </button>
      )}

      {state === 'recording' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-600">{fmtTime(seconds)}</span>
            </div>
            <span className="text-xs text-muted">جاري التسجيل...</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            {t('charges_audio_stop')}
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          {t('charges_audio_uploading')}
        </div>
      )}

      {(state === 'ready' || state === 'error') && (
        <div className="space-y-2">
          {state === 'ready' && audioSrc && (
            <audio src={audioSrc} controls className="w-full h-10" />
          )}
          {state === 'error' && (
            <p className="text-xs text-red-500 text-center">حدث خطأ، حاول مرة أخرى</p>
          )}
          <div className="flex items-center justify-between">
            {state === 'ready' && (
              <span className="text-xs text-success font-medium">{t('charges_audio_ready')}</span>
            )}
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted underline hover:text-nardo transition-colors ms-auto"
            >
              {t('charges_audio_retake')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function NewChargeContent() {
  const { t } = useTranslation()
  const [isConteneur, setIsConteneur] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title={t('charges_publish_title')} backHref="/dashboard" />

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mt-4">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={publishCharge} className="space-y-4 mt-4">

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">{t('charges_departure')}</label>
            <select name="ville_depart" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">{t('charges_choose')}</option>
              {CITIES_AR.map(c => <option key={c.value} value={c.value}>{c.ar}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">{t('charges_arrival')}</label>
            <select name="ville_arrivee" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">{t('charges_choose')}</option>
              {CITIES_AR.map(c => <option key={c.value} value={c.value}>{c.ar}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">{t('charges_vehicle_type')}</label>
            <select name="type_requis" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">{t('charges_choose')}</option>
              <option value="camion">{t('charges_camion')}</option>
              <option value="remorque">{t('charges_remorque')}</option>
              <option value="les_deux">{t('charges_les_deux')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">
              {t('charges_weight')} <span className="text-gray-400">— {t('charges_weight_optional')}</span>
            </label>
            <input name="poids_kg" type="number" min="1" placeholder="Ex: 5"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">{t('charges_price')}</label>
            <input name="prix_total_mad" type="number" min="1" required placeholder="Ex: 1600"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">
              {t('charges_description')} <span className="text-gray-400">— {t('charges_weight_optional')}</span>
            </label>
            <textarea name="description" rows={3} placeholder="Ex: Sacs de ciment, chargement rapide..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_conteneur"
                value="true"
                checked={isConteneur}
                onChange={e => setIsConteneur(e.target.checked)}
                className="w-5 h-5 rounded border-border accent-accent cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">{t('charges_conteneur_check')}</span>
            </label>
          </div>

          {isConteneur && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600">{t('charges_width')}</label>
                <input
                  name="largeur_cm"
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 235"
                  className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600">{t('charges_height')}</label>
                <input
                  name="hauteur_cm"
                  type="number"
                  min="1"
                  required
                  placeholder="Ex: 269"
                  className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]"
                />
              </div>
            </div>
          )}

          {/* Audio recording section */}
          <AudioRecorder onUrl={setAudioUrl} />
          {audioUrl && (
            <input type="hidden" name="audio_url" value={audioUrl} />
          )}

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base mt-2">
            {t('charges_publish_btn')}
          </button>
        </form>
      </main>
    </div>
  )
}
