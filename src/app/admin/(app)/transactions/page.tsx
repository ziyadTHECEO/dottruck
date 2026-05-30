import { createAdminClient } from '@/lib/supabase/admin'
import TransactionsContent from '@/components/admin/TransactionsContent'

export default async function AdminTransactionsPage() {
  const supabase = createAdminClient()

  const { data: matchings } = await supabase
    .from('matchings')
    .select(`
      id, statut, prix_final, paid, created_at,
      charges(ville_depart, ville_arrivee),
      transporteur_complet_id, transporteur_camion_id
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get transporteur names
  const transporteurIds = (matchings ?? [])
    .map(m => m.transporteur_complet_id ?? m.transporteur_camion_id)
    .filter(Boolean) as string[]

  let nameMap = new Map<string, string>()
  if (transporteurIds.length > 0) {
    const { data: transporteurs } = await supabase
      .from('users')
      .select('id, nom')
      .in('id', transporteurIds)
    nameMap = new Map((transporteurs ?? []).map(t => [t.id, t.nom]))
  }

  const formatted = (matchings ?? []).map(m => ({
    id: m.id,
    statut: m.statut,
    prix_final: m.prix_final,
    paid: m.paid ?? false,
    created_at: m.created_at,
    charge: Array.isArray(m.charges) ? m.charges[0] as { ville_depart: string; ville_arrivee: string } : m.charges as { ville_depart: string; ville_arrivee: string } | null,
    transporteur_nom: nameMap.get(m.transporteur_complet_id ?? m.transporteur_camion_id ?? '') ?? null,
  }))

  return <TransactionsContent matchings={formatted} />
}
