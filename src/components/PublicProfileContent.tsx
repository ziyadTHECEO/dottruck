'use client'

import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

const VEHICLE_LABELS: Record<string, string> = {
  camion_seul: 'شاحنة',
  plateau_barres: 'بلاطو بالبار',
  plateau: 'بلاطو',
  frigorifique: 'فريغو',
  benne: 'بين',
}

interface Props {
  targetUser: {
    id: string
    nom: string | null
    ville: string | null
    avatar_url: string | null
  }
  profile: {
    type: string
    vehicle_type: string | null
    description_vehicule: string | null
    score: number
    capacite_tonnes: number | null
    disponible: boolean
    verification_status: string | null
  } | null
  avgRating: number
  ratingsCount: number
  ratings: { note: number; commentaire: string | null; created_at: string }[]
  completedCount: number
  isOwnProfile: boolean
}

export default function PublicProfileContent({
  targetUser,
  profile,
  avgRating,
  ratingsCount,
  ratings,
  completedCount,
  isOwnProfile,
}: Props) {
  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title="البروفيل" backHref="/matching" />

      {/* Hero */}
      <div className="bg-white px-4 py-8 flex flex-col items-center text-center border-b border-border">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden mb-4">
          {targetUser.avatar_url ? (
            <img src={targetUser.avatar_url} alt={targetUser.nom ?? ''} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-accent">{targetUser.nom?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-nardo">{targetUser.nom}</h2>
        {targetUser.ville && <p className="text-sm text-muted mt-0.5">{targetUser.ville}</p>}

        {/* Verification badge */}
        {profile?.verification_status === 'verified' && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-success border border-success/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            متحقق
          </div>
        )}

        {/* Rating */}
        {ratingsCount > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="font-semibold text-nardo text-sm">{avgRating}</span>
            <span className="text-muted text-sm">({ratingsCount} تقييم)</span>
          </div>
        )}
      </div>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Stats */}
        {profile && (
          <div className="bg-white px-4 py-5 border-b border-border mt-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-nardo">{completedCount}</p>
                <p className="text-xs text-muted mt-1">رحلة مكملة</p>
              </div>
              <div className="border-x border-border">
                <p className="text-2xl font-bold text-nardo">{profile.score}</p>
                <p className="text-xs text-muted mt-1">النقاط</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-nardo">
                  {profile.disponible ? (
                    <span className="text-success">متاح</span>
                  ) : (
                    <span className="text-muted">مشغول</span>
                  )}
                </p>
                <p className="text-xs text-muted mt-1">الحالة</p>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle info */}
        {profile?.vehicle_type && (
          <div className="bg-white px-4 py-4 border-b border-border mt-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">المركبة</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-nardo">{VEHICLE_LABELS[profile.vehicle_type] ?? profile.vehicle_type}</p>
                {profile.capacite_tonnes && (
                  <p className="text-xs text-muted">سعة: {profile.capacite_tonnes} طن</p>
                )}
                {profile.description_vehicule && (
                  <p className="text-xs text-muted mt-0.5">{profile.description_vehicule}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent ratings */}
        {ratings.length > 0 && (
          <div className="bg-white px-4 py-5 border-b border-border mt-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">التقييمات</p>
            <div className="space-y-3">
              {ratings.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= r.note ? '#D97706' : '#E2E8F0'} stroke={s <= r.note ? '#D97706' : '#E2E8F0'} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  {r.commentaire && (
                    <p className="text-sm text-muted">&quot;{r.commentaire}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
