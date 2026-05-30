import { createAdminClient } from '@/lib/supabase/admin'
import UsersContent from '@/components/admin/UsersContent'

export default async function AdminUsersPage() {
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, nom, email, ville, role, banned, ban_reason, avatar_url, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  const userIds = (users ?? []).map(u => u.id)

  // Count charges per user
  const { data: chargesCounts } = await supabase
    .from('charges')
    .select('expediteur_id')
    .in('expediteur_id', userIds.length > 0 ? userIds : ['_'])

  const chargesMap: Record<string, number> = {}
  for (const c of chargesCounts ?? []) {
    chargesMap[c.expediteur_id] = (chargesMap[c.expediteur_id] ?? 0) + 1
  }

  // Count matchings per user
  const { data: matchingsCounts } = await supabase
    .from('matchings')
    .select('transporteur_complet_id, transporteur_camion_id, transporteur_remorque_id')

  const matchingsMap: Record<string, number> = {}
  for (const m of matchingsCounts ?? []) {
    for (const id of [m.transporteur_complet_id, m.transporteur_camion_id, m.transporteur_remorque_id]) {
      if (id) matchingsMap[id] = (matchingsMap[id] ?? 0) + 1
    }
  }

  const formatted = (users ?? []).map(u => ({
    ...u,
    banned: u.banned ?? false,
    charges_count: chargesMap[u.id] ?? 0,
    matchings_count: matchingsMap[u.id] ?? 0,
  }))

  return <UsersContent users={formatted} />
}
