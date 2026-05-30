'use client'

import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { useTranslation } from '@/lib/i18n/context'

const VEHICLE_LABELS: Record<string, string> = {
  camion_seul: 'شاحنة',
  plateau_barres: 'بلاطو بالبار',
  plateau: 'بلاطو',
  frigorifique: 'فريغو',
  benne: 'بين',
}

interface Props {
  profile: {
    vehicle_type: string | null
    photo_carte_grise: string | null
    photo_autorisation: string | null
    photo_vehicule: string | null
    verification_status: string | null
  }
  user: {
    nom: string | null
    email: string | null
    phone: string | null
    ville: string | null
    avatar_url: string | null
  } | null
}

export default function TransporteurProfileView({ profile, user }: Props) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title={t('profile_info')} backHref="/profile/settings" />

      {/* Hero section — centered avatar + name */}
      <div className="bg-white px-4 py-8 flex flex-col items-center text-center border-b border-border">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden mb-4">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.nom ?? ''} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-accent">{user?.nom?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-nardo">{user?.nom}</h2>
        {user?.email && <p className="text-sm text-muted mt-0.5">{user.email}</p>}
        {user?.phone && <p className="text-xs text-muted mt-1" dir="ltr">{user.phone}</p>}
        {user?.ville && <p className="text-xs text-muted mt-1">{user.ville}</p>}

        {/* Verification status badge */}
        <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          profile.verification_status === 'verified'
            ? 'bg-green-50 text-success border-success/20'
            : profile.verification_status === 'rejected'
            ? 'bg-red-50 text-error border-error/20'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {profile.verification_status === 'verified' && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              تم التحقق
            </>
          )}
          {profile.verification_status === 'pending' && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              في انتظار التحقق
            </>
          )}
          {profile.verification_status === 'rejected' && (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              مرفوض
            </>
          )}
        </div>
      </div>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Vehicle type */}
        {profile.vehicle_type && (
          <div className="bg-white px-4 py-4 border-b border-border mt-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">نوع المركبة</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <p className="font-semibold text-nardo">{VEHICLE_LABELS[profile.vehicle_type] ?? profile.vehicle_type}</p>
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white px-4 py-5 border-b border-border mt-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">الوثائق</p>
          <div className="grid grid-cols-3 gap-3">
            {profile.photo_carte_grise && (
              <a href={profile.photo_carte_grise} target="_blank" rel="noopener noreferrer" className="block">
                <div className="aspect-[3/4] rounded-xl border-2 border-border overflow-hidden bg-surface">
                  <img src={profile.photo_carte_grise} alt="Carte grise" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-muted text-center mt-1.5 font-medium">البطاقة الرمادية</p>
              </a>
            )}
            {profile.photo_autorisation && (
              <a href={profile.photo_autorisation} target="_blank" rel="noopener noreferrer" className="block">
                <div className="aspect-[3/4] rounded-xl border-2 border-border overflow-hidden bg-surface">
                  <img src={profile.photo_autorisation} alt="Autorisation" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-muted text-center mt-1.5 font-medium">الإذن</p>
              </a>
            )}
            {profile.photo_vehicule && (
              <a href={profile.photo_vehicule} target="_blank" rel="noopener noreferrer" className="block">
                <div className="aspect-[3/4] rounded-xl border-2 border-border overflow-hidden bg-surface">
                  <img src={profile.photo_vehicule} alt="Véhicule" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-muted text-center mt-1.5 font-medium">صورة المركبة</p>
              </a>
            )}
          </div>

          {/* Missing documents warning */}
          {(!profile.photo_carte_grise || !profile.photo_autorisation || !profile.photo_vehicule) && (
            <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-amber-700 leading-relaxed">
                بعض الوثائق خاصها تعاود تترسل. شوف الإشعارات ديالك.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
