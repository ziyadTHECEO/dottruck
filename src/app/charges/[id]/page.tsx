import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TopHeader } from '@/components/ui/TopHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { translateCity } from '@/lib/i18n/translations'

async function markCompleted(chargeId: string, userId: string) {
  'use server'
  const supabase = await createClient()

  // Verify user has an active matching for this charge
  const { data: matching } = await supabase
    .from('matchings')
    .select('id')
    .eq('charge_id', chargeId)
    .or(`transporteur_camion_id.eq.${userId},transporteur_remorque_id.eq.${userId},transporteur_complet_id.eq.${userId}`)
    .maybeSingle()

  if (!matching) return redirect(`/charges/${chargeId}?error=no_matching`)

  // Update matching status
  await supabase
    .from('matchings')
    .update({ statut: 'accepté' })
    .eq('id', matching.id)

  // Update charge status
  await supabase
    .from('charges')
    .update({ statut: 'completee' })
    .eq('id', chargeId)

  // Award score to transporteur (ignore if RPC doesn't exist)
  await supabase.rpc('increment_score', { user_id: userId, points: 10 })

  return redirect(`/charges/${chargeId}`)
}

async function createMatching(chargeId: string, userId: string) {
  'use server'
  const supabase = await createClient()

  // Get user's transporteur profile to determine which field to set
  const { data: tp } = await supabase
    .from('transporteur_profiles')
    .select('type')
    .eq('user_id', userId)
    .single()

  const insertData: Record<string, string> = {
    charge_id: chargeId,
    statut: 'proposé',
  }

  if (tp?.type === 'A') {
    insertData.transporteur_camion_id = userId
  } else if (tp?.type === 'B') {
    insertData.transporteur_remorque_id = userId
  } else {
    insertData.transporteur_complet_id = userId
  }

  const { data, error } = await supabase
    .from('matchings')
    .insert(insertData)
    .select('id')
    .single()

  if (error || !data) return redirect(`/charges/${chargeId}?error=matching_failed`)

  // Update charge status
  await supabase
    .from('charges')
    .update({ statut: 'en_cours' })
    .eq('id', chargeId)

  return redirect(`/chat/${data.id}`)
}

export default async function ChargeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: charge } = await supabase
    .from('charges')
    .select('*')
    .eq('id', id)
    .single()

  if (!charge) return notFound()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check if user already has a matching for this charge
  const { data: existingMatching } = await supabase
    .from('matchings')
    .select('id, statut')
    .eq('charge_id', id)
    .or(`transporteur_camion_id.eq.${user.id},transporteur_remorque_id.eq.${user.id},transporteur_complet_id.eq.${user.id}`)
    .maybeSingle()

  // Get expediteur info
  const { data: expediteur } = await supabase
    .from('users')
    .select('nom, ville')
    .eq('id', charge.expediteur_id)
    .single()

  const isOwner = charge.expediteur_id === user.id
  const isTransporteur = userProfile?.role === 'transporteur'
  const hasMatching = !!existingMatching
  const isOpen = charge.statut === 'ouverte'

  const typeLabel: Record<string, string> = {
    camion: 'كاميون بوحدو',
    remorque: 'رمورك بوحدها',
    les_deux: 'كاميون + رمورك',
  }

  const statusMap: Record<string, { status: 'success' | 'warning' | 'pending' | 'error'; label: string }> = {
    ouverte: { status: 'success', label: 'مفتوحة' },
    en_cours: { status: 'warning', label: 'في الطريق' },
    completee: { status: 'success', label: 'مكملة' },
    annulee: { status: 'error', label: 'ملغية' },
  }

  const chargeStatus = statusMap[charge.statut] ?? { status: 'pending' as const, label: charge.statut }

  const createMatchingAction = createMatching.bind(null, id, user.id)
  const markCompletedAction = markCompleted.bind(null, id, user.id)
  const isEnCours = charge.statut === 'en_cours'

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title="التفاصيل" backHref="/dashboard" />

      <main className="flex-1 pb-28 max-w-lg mx-auto w-full">
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-error rounded-xl p-3 text-sm">
            وقع خطأ. عاود المحاولة.
          </div>
        )}

        {/* Header */}
        <div className="bg-white px-4 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nardo">
              {charge.description ?? `${translateCity(charge.ville_depart)} → ${translateCity(charge.ville_arrivee)}`}
            </h2>
            <StatusBadge status={chargeStatus.status} label={chargeStatus.label} />
          </div>
          {expediteur && (
            <div className="flex items-center gap-1.5 mt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm text-muted">من {expediteur.nom}{expediteur.ville ? ` — ${expediteur.ville}` : ''}</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {/* Route */}
          <section className="bg-white px-4 py-5 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">الطريق</p>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <span className="w-3 h-3 rounded-full bg-accent border-2 border-accent/30"></span>
                <span className="w-px h-8 bg-border my-1"></span>
                <span className="w-3 h-3 rounded-full bg-nardo border-2 border-nardo/30"></span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-nardo text-base">{translateCity(charge.ville_depart)}</p>
                  <p className="text-xs text-muted">الانطلاق</p>
                </div>
                <div>
                  <p className="font-semibold text-nardo text-base">{translateCity(charge.ville_arrivee)}</p>
                  <p className="text-xs text-muted">الوصول</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cargo info */}
          <section className="bg-white px-4 py-5 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">الشحنة</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3.5">
                <p className="text-xs text-muted">الوزن</p>
                <p className="font-semibold text-nardo mt-1">
                  {charge.poids_kg ? `${charge.poids_kg} طن` : '—'}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-3.5">
                <p className="text-xs text-muted">النوع المطلوب</p>
                <p className="font-semibold text-nardo mt-1">
                  {typeLabel[charge.type_requis] ?? charge.type_requis}
                </p>
              </div>
            </div>
            {charge.is_conteneur && (
              <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-2">
                <span className="text-xs font-semibold text-accent">📦 كونتينار</span>
                {charge.largeur_cm && charge.hauteur_cm && (
                  <span className="text-xs text-muted">{charge.largeur_cm} × {charge.hauteur_cm} سم</span>
                )}
              </div>
            )}
          </section>

          {/* Price */}
          <section className="bg-white px-4 py-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">الثمن المقترح</p>
            <p className="text-3xl font-bold text-nardo mt-2">
              {charge.prix_total_mad.toLocaleString()}{' '}
              <span className="text-base font-normal text-muted">درهم</span>
            </p>
            <p className="text-xs text-muted mt-1">قابل للتفاوض عبر الشات</p>
          </section>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-10">
        <div className="max-w-lg mx-auto">
          {isTransporteur && isOpen && !hasMatching && (
            <form action={createMatchingAction}>
              <button
                type="submit"
                className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base cursor-pointer"
              >
                قبل هاد الشحنة
              </button>
            </form>
          )}
          {isTransporteur && hasMatching && isEnCours && (
            <div className="space-y-2">
              <Link
                href={`/chat/${existingMatching!.id}`}
                className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base"
              >
                فتح المفاوضة
              </Link>
              <form action={markCompletedAction}>
                <button
                  type="submit"
                  className="w-full min-h-[48px] bg-success hover:bg-success/90 text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                >
                  ✓ كملت التوصيل
                </button>
              </form>
            </div>
          )}
          {isTransporteur && hasMatching && !isEnCours && charge.statut !== 'completee' && (
            <Link
              href={`/chat/${existingMatching!.id}`}
              className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base"
            >
              فتح المفاوضة
            </Link>
          )}
          {isTransporteur && hasMatching && charge.statut === 'completee' && (
            <div className="text-center py-2">
              <p className="text-success font-semibold text-sm">✓ هاد الشحنة مكملة</p>
            </div>
          )}
          {isTransporteur && !isOpen && !hasMatching && (
            <div className="text-center py-2">
              <p className="text-muted text-sm">هاد الشحنة ما عادت متوفرة</p>
            </div>
          )}
          {isOwner && charge.statut === 'completee' && (
            <div className="text-center py-2">
              <p className="text-success font-semibold text-sm">✓ هاد الشحنة مكملة</p>
            </div>
          )}
          {isOwner && charge.statut !== 'completee' && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base"
            >
              ارجع للوحة
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
