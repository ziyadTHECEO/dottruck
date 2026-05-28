import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ matchingId?: string }>
}) {
  const { matchingId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  let cargo = 'Charge'
  let route = '? → ?'
  let price = 0
  let partnerName = 'Partenaire'
  let partnerPhone = ''
  let partnerRating = 0

  if (matchingId) {
    const { data: matching } = await supabase
      .from('matchings')
      .select('*, charges(ville_depart, ville_arrivee, prix_total_mad, description, poids_kg)')
      .eq('id', matchingId)
      .single()

    if (matching) {
      const charge = matching.charges as unknown as {
        ville_depart: string
        ville_arrivee: string
        prix_total_mad: number
        description: string | null
        poids_kg: number | null
      } | null

      cargo = charge?.description ?? `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`
      route = `${charge?.ville_depart ?? '?'} → ${charge?.ville_arrivee ?? '?'}`
      price = charge?.prix_total_mad ?? 0

      // Get partner info
      const partnerId = matching.transporteur_camion_id ?? matching.transporteur_remorque_id ?? matching.transporteur_complet_id
      if (partnerId && partnerId !== user.id) {
        const { data: partner } = await supabase
          .from('users')
          .select('nom, phone')
          .eq('id', partnerId)
          .single()

        if (partner) {
          partnerName = partner.nom ?? 'Partenaire'
          partnerPhone = partner.phone ?? ''
        }

        const { data: tp } = await supabase
          .from('transporteur_profiles')
          .select('score, type')
          .eq('user_id', partnerId)
          .maybeSingle()

        if (tp) {
          partnerRating = tp.score
          partnerName += tp.type === 'A' ? ' (Camion)' : tp.type === 'B' ? ' (Remorque)' : ' (Complet)'
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start px-6 pt-16 pb-10">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-nardo text-center">Charge acceptee</h1>
          <p className="text-muted text-sm text-center mt-1">Votre charge est confirmee</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-3">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Resume</p>
          {[
            { label: 'Charge', value: cargo },
            { label: 'Trajet', value: route },
            { label: 'Prix', value: `${price.toLocaleString()} MAD` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-muted text-sm">{label}</span>
              <span className="font-semibold text-nardo text-sm">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted text-sm">Partenaire</span>
            <div className="text-right">
              <p className="font-semibold text-nardo text-sm">{partnerName}</p>
              {partnerRating > 0 && (
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-xs text-muted">{partnerRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        {partnerPhone && (
          <div className="bg-white rounded-xl border border-border p-5 mt-3 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Contact partenaire</p>
            <p className="font-semibold text-nardo">{partnerPhone}</p>
            <div className="flex gap-2">
              <a href={`tel:${partnerPhone}`}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Appeler
              </a>
              <a href={`sms:${partnerPhone}`}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-colors text-sm cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                SMS
              </a>
            </div>
          </div>
        )}

        {/* Nav actions */}
        <div className="flex gap-3 mt-6">
          <Link href="/history"
            className="flex-1 min-h-[48px] flex items-center justify-center bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-colors text-sm cursor-pointer">
            Historique
          </Link>
          <Link href="/dashboard"
            className="flex-1 min-h-[48px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
