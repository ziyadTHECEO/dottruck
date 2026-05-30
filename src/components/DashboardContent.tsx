'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/context'
import { ChargeCard } from '@/components/ChargeCard'
import { NotificationBar } from '@/components/NotificationBar'
import { BottomNav } from '@/components/ui/BottomNav'
import { AudioButton } from '@/components/ui/AudioButton'
import { signOut } from '@/app/auth/actions'

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

interface TransporteurProfile {
  type: 'A' | 'B' | 'C'
  description_vehicule: string | null
  score: number
}

interface DashboardContentProps {
  charges: Charge[]
  userProfile: {
    nom?: string
    role?: string
  } | null
  transporteurProfile: TransporteurProfile | null
  isTransporteur: boolean
  userId: string
  userName: string
}

export function DashboardContent({
  charges,
  userProfile,
  transporteurProfile,
  isTransporteur,
  userId,
  userName,
}: DashboardContentProps) {
  const { t, lang } = useTranslation()

  const chargeCountText = isTransporteur
    ? `${charges.length} ${charges.length !== 1 ? t('dashboard_charges_available_plural') : t('dashboard_charges_available')}`
    : `${charges.length} ${charges.length !== 1 ? t('dashboard_charges_published_plural') : t('dashboard_charges_published')}`

  const greetingAudioText = `${t('dashboard_greeting')} ${userName}`

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <NotificationBar userId={userId} />

      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Dottruck" width={32} height={32} />
          <Image src="/logo-text.png" alt="DOTTRUCK" width={110} height={22} />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface text-muted transition-colors" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-muted hover:text-error transition-colors" aria-label={t('dashboard_logout')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-24 max-w-lg mx-auto w-full space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-nardo">{t('dashboard_greeting')} {userName}</p>
            <AudioButton text={greetingAudioText} size="sm" />
          </div>
          <p className="text-sm text-muted mt-1">
            {chargeCountText}
          </p>
        </div>

        {transporteurProfile && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-sm font-medium text-accent">
              {transporteurProfile.type === 'A' && t('dashboard_type_a_info')}
              {transporteurProfile.type === 'B' && t('dashboard_type_b_info')}
              {transporteurProfile.type === 'C' && t('dashboard_type_c_info')}
            </p>
          </div>
        )}

        {!isTransporteur && (
          <div className="flex justify-between items-center">
            <p className="text-base font-bold text-nardo">{t('dashboard_my_charges')}</p>
            <Link
              href="/charges/new"
              className="flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-accent-hover transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('dashboard_publish')}
            </Link>
          </div>
        )}

        {isTransporteur && charges.length > 0 && (
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">{t('dashboard_available_charges')}</p>
        )}

        {isTransporteur && !transporteurProfile ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-muted">{t('dashboard_no_profile')}</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors"
            >
              {t('dashboard_setup_profile')}
            </Link>
          </div>
        ) : charges.length > 0 ? (
          <div className="space-y-3">
            {charges.map(charge => (
              <ChargeCard key={charge.id} charge={charge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <p className="text-muted text-sm">
              {isTransporteur
                ? t('dashboard_no_charges_transporteur')
                : t('dashboard_no_charges_expediteur')}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
