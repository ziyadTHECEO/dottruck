'use client'

import Link from 'next/link'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { useTranslation } from '@/lib/i18n/context'

interface Partner {
  user_id: string
  type: string
  description_vehicule: string | null
  score: number
  capacite_tonnes: number | null
  disponible: boolean
  nom: string
  ville: string | null
  ratingsCount: number
}

interface MatchingContentProps {
  myProfile: { type: string } | null
  partners: Partner[]
  lookingForType: string | null
}

export default function MatchingContent({ myProfile, partners, lookingForType }: MatchingContentProps) {
  const { t } = useTranslation()

  const lookingForLabel = myProfile?.type === 'A'
    ? t('matching_remorques')
    : myProfile?.type === 'B'
      ? t('matching_camions')
      : t('matching_partners')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title={t('matching_title')} backHref="/dashboard" />

      <main className="flex-1 px-4 pt-6 pb-24 max-w-lg mx-auto w-full space-y-6">
        <div>
          <h2 className="text-lg font-bold text-nardo">{t('matching_find')}</h2>
          <p className="text-muted text-sm mt-1">{lookingForLabel} {t('matching_nearby')}</p>
        </div>

        {!myProfile ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-muted text-sm">{t('matching_no_profile')}</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors"
            >
              {t('dashboard_setup_profile')}
            </Link>
          </div>
        ) : myProfile.type === 'C' ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-nardo font-semibold">{t('matching_type_c')}</p>
            <p className="text-muted text-sm">{t('matching_type_c_desc')}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center min-h-[44px] px-5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t('matching_view_charges')}
            </Link>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-muted text-sm">{t('matching_no_partners')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.user_id} className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-nardo text-sm">{partner.nom}</p>
                    {partner.ville && (
                      <p className="text-xs text-muted mt-0.5">{partner.ville}</p>
                    )}
                    {partner.description_vehicule && (
                      <p className="text-xs text-muted mt-1">{partner.description_vehicule}</p>
                    )}
                    {partner.capacite_tonnes && (
                      <p className="text-xs text-muted mt-0.5">{t('matching_capacity')}: {partner.capacite_tonnes}T</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-2 h-2 rounded-full bg-success"></span>
                      <span className="text-xs text-success font-medium">{t('matching_available')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {partner.score > 0 && (
                      <>
                        <div className="flex items-center gap-1 justify-end">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span className="text-sm font-semibold text-nardo">{partner.score}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{partner.ratingsCount} {t('matching_reviews')}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/profile/${partner.user_id}`}
                    className="flex-1 min-h-[44px] flex items-center justify-center bg-white border border-border text-nardo text-sm font-semibold rounded-xl hover:bg-surface transition-colors cursor-pointer"
                  >
                    {t('matching_view_profile')}
                  </Link>
                  <Link
                    href={`/profile/${partner.user_id}`}
                    className="flex-1 min-h-[44px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {t('matching_contact')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
