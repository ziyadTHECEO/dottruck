import { createAdminClient } from '@/lib/supabase/admin'
import AdminVerifyContent from '@/components/AdminVerifyContent'

export const dynamic = 'force-dynamic'

export default async function AdminTransporteursPage() {
  const supabase = createAdminClient()

  const { data: pendingProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .or('verification_status.eq.pending,verification_status.is.null')

  const { data: verifiedProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .eq('verification_status', 'verified')

  const { data: rejectedProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .eq('verification_status', 'rejected')

  return (
    <AdminVerifyContent
      pendingProfiles={pendingProfiles ?? []}
      verifiedProfiles={verifiedProfiles ?? []}
      rejectedProfiles={rejectedProfiles ?? []}
    />
  )
}
