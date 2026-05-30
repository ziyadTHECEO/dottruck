'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { completeTransporteurSetup } from '@/app/profile/actions'
import { TopHeader } from '@/components/ui/TopHeader'

const VEHICLE_TYPES = [
  {
    value: 'camion_seul',
    icon: (
      <svg viewBox="0 0 64 40" fill="none" className="w-16 h-10">
        <rect x="2" y="8" width="40" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="42" y="14" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="30" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="52" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: 'plateau_barres',
    icon: (
      <svg viewBox="0 0 64 40" fill="none" className="w-16 h-10">
        <rect x="2" y="18" width="58" height="6" rx="1" stroke="currentColor" strokeWidth="2.5" />
        <line x1="8" y1="8" x2="8" y2="18" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="8" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
        <line x1="32" y1="8" x2="32" y2="18" stroke="currentColor" strokeWidth="2" />
        <line x1="44" y1="8" x2="44" y2="18" stroke="currentColor" strokeWidth="2" />
        <line x1="56" y1="8" x2="56" y2="18" stroke="currentColor" strokeWidth="2" />
        <circle cx="14" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: 'plateau',
    icon: (
      <svg viewBox="0 0 64 40" fill="none" className="w-16 h-10">
        <rect x="2" y="18" width="58" height="6" rx="1" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="30" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: 'frigorifique',
    icon: (
      <svg viewBox="0 0 64 40" fill="none" className="w-16 h-10">
        <rect x="2" y="8" width="58" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M31 12v14M25 19l6-4 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
        <rect x="50" y="4" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    value: 'benne',
    icon: (
      <svg viewBox="0 0 64 40" fill="none" className="w-16 h-10">
        <path d="M6 10L2 28h56l-4-18H6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="2" y1="28" x2="60" y2="28" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
]

interface ResendMode {
  targetFields: string[]
  message: string | null
  audioUrl: string | null
}

interface Props {
  userId: string
  resendMode?: ResendMode
}

export default function TransporteurSetupWizard({ userId, resendMode }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()

  // If in resend mode, start directly on step 3 (documents)
  const [step, setStep] = useState(resendMode ? 3 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  // Step 2: Vehicle type
  const [vehicleType, setVehicleType] = useState<string | null>(null)

  // Step 3: Documents
  const [carteGrise, setCarteGrise] = useState<File | null>(null)
  const [carteGrisePreview, setCarteGrisePreview] = useState<string | null>(null)
  const [autorisation, setAutorisation] = useState<File | null>(null)
  const [autorisationPreview, setAutorisationPreview] = useState<string | null>(null)
  const [photoVehicule, setPhotoVehicule] = useState<File | null>(null)
  const [photoVehiculePreview, setPhotoVehiculePreview] = useState<string | null>(null)
  const carteGriseRef = useRef<HTMLInputElement>(null)
  const autorisationRef = useRef<HTMLInputElement>(null)
  const photoVehiculeRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    file: File | undefined,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    if (!file) return
    setFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const ts = Date.now()

    if (resendMode) {
      // Resend mode: only upload targeted fields
      const fields = resendMode.targetFields
      const uploads: Record<string, string | null> = {}

      if (fields.includes('photo_carte_grise') && carteGrise) {
        uploads.photo_carte_grise = await uploadFile(carteGrise, 'transporteur-docs', `${userId}/${ts}-carte-grise.${carteGrise.name.split('.').pop()}`)
      }
      if (fields.includes('photo_autorisation') && autorisation) {
        uploads.photo_autorisation = await uploadFile(autorisation, 'transporteur-docs', `${userId}/${ts}-autorisation.${autorisation.name.split('.').pop()}`)
      }
      if (fields.includes('photo_vehicule') && photoVehicule) {
        uploads.photo_vehicule = await uploadFile(photoVehicule, 'transporteur-docs', `${userId}/${ts}-vehicule.${photoVehicule.name.split('.').pop()}`)
      }

      // Check all uploads succeeded
      for (const key of Object.keys(uploads)) {
        if (!uploads[key]) { setLoading(false); return }
      }

      // Update transporteur profile with new photos
      const updateData: Record<string, string | null> = { verification_status: 'pending' }
      for (const [key, val] of Object.entries(uploads)) {
        if (val) updateData[key] = val
      }

      const { error: updateError } = await supabase
        .from('transporteur_profiles')
        .update(updateData)
        .eq('user_id', userId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      return
    }

    // Normal flow: full setup
    if (!avatarFile || !vehicleType || !carteGrise || !autorisation || !photoVehicule) return

    const [avatarUrl, carteGriseUrl, autorisationUrl, photoVehiculeUrl] = await Promise.all([
      uploadFile(avatarFile, 'avatars', `${userId}/${ts}-avatar.${avatarFile.name.split('.').pop()}`),
      uploadFile(carteGrise, 'transporteur-docs', `${userId}/${ts}-carte-grise.${carteGrise.name.split('.').pop()}`),
      uploadFile(autorisation, 'transporteur-docs', `${userId}/${ts}-autorisation.${autorisation.name.split('.').pop()}`),
      uploadFile(photoVehicule, 'transporteur-docs', `${userId}/${ts}-vehicule.${photoVehicule.name.split('.').pop()}`),
    ])

    if (!avatarUrl || !carteGriseUrl || !autorisationUrl || !photoVehiculeUrl) {
      setLoading(false)
      return
    }

    const result = await completeTransporteurSetup({
      avatarUrl,
      vehicleType,
      carteGriseUrl,
      autorisationUrl,
      photoVehiculeUrl,
    })

    if (!result.success) {
      setError(result.error ?? 'خطأ')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const canProceed = () => {
    if (step === 1) return !!avatarFile
    if (step === 2) return !!vehicleType
    if (step === 3) {
      if (resendMode) {
        // Only require targeted fields
        const fields = resendMode.targetFields
        if (fields.includes('photo_carte_grise') && !carteGrise) return false
        if (fields.includes('photo_autorisation') && !autorisation) return false
        if (fields.includes('photo_vehicule') && !photoVehicule) return false
        return fields.length > 0
      }
      return !!carteGrise && !!autorisation && !!photoVehicule
    }
    return false
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
    else handleSubmit()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <TopHeader title={t('setup_title')} backHref={step > 1 ? undefined : '/dashboard'} />

      {/* Progress bar (hidden in resend mode) */}
      {!resendMode && (
        <div className="flex gap-1.5 px-4 py-3">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? 'bg-accent' : 'bg-border'
            }`} />
          ))}
        </div>
      )}

      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Avatar */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-nardo">{t('setup_photo_title')}</h2>
              <p className="text-muted mt-1 text-sm">{t('setup_photo_desc')}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="w-32 h-32 rounded-full border-2 border-dashed border-accent/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition-colors bg-accent/5"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0], setAvatarFile, setAvatarPreview)}
              />
              <p className="text-xs text-muted">{t('setup_photo_tap')}</p>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Type */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-nardo">{t('setup_vehicle_title')}</h2>
              <p className="text-muted mt-1 text-sm">{t('setup_vehicle_desc')}</p>
            </div>

            <div className="space-y-2">
              {VEHICLE_TYPES.map(vt => (
                <button
                  key={vt.value}
                  type="button"
                  onClick={() => setVehicleType(vt.value)}
                  className={`w-full flex items-center gap-4 border-2 rounded-xl p-4 transition-colors cursor-pointer text-right ${
                    vehicleType === vt.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/40 bg-white'
                  }`}
                >
                  <div className={`shrink-0 ${vehicleType === vt.value ? 'text-accent' : 'text-muted'}`}>
                    {vt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-nardo text-sm">{t(`setup_vehicle_${vt.value}` as never)}</p>
                    <p className="text-xs text-muted mt-0.5">{t(`setup_vehicle_${vt.value}_desc` as never)}</p>
                  </div>
                  {vehicleType === vt.value && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-4">
            {resendMode ? (
              <>
                <div>
                  <h2 className="text-xl font-bold text-nardo">أعد إرسال الوثائق</h2>
                  <p className="text-muted mt-1 text-sm">الأدمين طلب منك تعاود ترسل بعض الوثائق</p>
                </div>

                {/* Admin message */}
                {(resendMode.message || resendMode.audioUrl) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-amber-800">رسالة من الأدمين</span>
                    </div>
                    {resendMode.message && (
                      <p className="text-sm text-amber-900">{resendMode.message}</p>
                    )}
                    {resendMode.audioUrl && (
                      <audio src={resendMode.audioUrl} controls className="w-full h-10" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-nardo">{t('setup_docs_title')}</h2>
                <p className="text-muted mt-1 text-sm">{t('setup_docs_desc')}</p>
              </div>
            )}

            {/* Carte grise */}
            {(!resendMode || resendMode.targetFields.includes('photo_carte_grise')) && (
              <DocumentUpload
                label={t('setup_doc_carte_grise')}
                preview={carteGrisePreview}
                inputRef={carteGriseRef}
                onSelect={(f) => handleFileSelect(f, setCarteGrise, setCarteGrisePreview)}
                blink={!!resendMode}
              />
            )}

            {/* Autorisation */}
            {(!resendMode || resendMode.targetFields.includes('photo_autorisation')) && (
              <DocumentUpload
                label={t('setup_doc_autorisation')}
                preview={autorisationPreview}
                inputRef={autorisationRef}
                onSelect={(f) => handleFileSelect(f, setAutorisation, setAutorisationPreview)}
                blink={!!resendMode}
              />
            )}

            {/* Photo véhicule */}
            {(!resendMode || resendMode.targetFields.includes('photo_vehicule')) && (
              <DocumentUpload
                label={t('setup_doc_photo_vehicule')}
                preview={photoVehiculePreview}
                inputRef={photoVehiculeRef}
                onSelect={(f) => handleFileSelect(f, setPhotoVehicule, setPhotoVehiculePreview)}
                blink={!!resendMode}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom buttons */}
      <div className="sticky bottom-0 bg-white border-t border-border p-4">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && !resendMode && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="min-h-[52px] px-6 border-2 border-border text-nardo font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {t('setup_back')}
            </button>
          )}
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className="flex-1 min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 019.95 9" />
                </svg>
                {t('setup_uploading')}
              </span>
            ) : resendMode ? 'إرسال الوثائق' : step === 3 ? t('setup_finish') : t('setup_next')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Document upload sub-component
function DocumentUpload({
  label,
  preview,
  inputRef,
  onSelect,
  blink = false,
}: {
  label: string
  preview: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelect: (file: File) => void
  blink?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-nardo">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-center cursor-pointer transition-colors bg-surface min-h-[120px] overflow-hidden ${
          blink && !preview
            ? 'border-amber-400 animate-pulse bg-amber-50/50 hover:border-amber-500'
            : 'border-border hover:border-accent/40'
        }`}
      >
        {preview ? (
          <img src={preview} alt={label} className="max-h-[100px] object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs">اضغط لتحميل الصورة</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onSelect(f)
        }}
      />
    </div>
  )
}
