import { createAdminClient } from '@/lib/supabase/admin'
import StatsCards from '@/components/admin/StatsCards'
import RevenueChart from '@/components/admin/RevenueChart'
import CityTransactionsChart from '@/components/admin/CityTransactionsChart'
import VehicleTypeChart from '@/components/admin/VehicleTypeChart'
import TransporteurMap from '@/components/admin/TransporteurMap'

const VEHICLE_LABELS: Record<string, string> = {
  camion_seul: 'Camion',
  plateau_barres: 'Plateau barres',
  plateau: 'Plateau',
  frigorifique: 'Frigo',
  benne: 'Benne',
}

export default async function AdminStatsPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Stat 1: Transactions this month
  const { count: transactionsThisMonth } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .in('statut', ['accepté', 'completé'])
    .gte('created_at', startOfMonth)

  // Stat 2: Total commission revenue
  const { data: acceptedMatchings } = await supabase
    .from('matchings')
    .select('prix_final')
    .in('statut', ['accepté', 'completé'])
    .not('prix_final', 'is', null)

  const totalRevenue = (acceptedMatchings ?? []).reduce(
    (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
    0
  )

  // Stat 3: Active transporteurs
  const { count: activeTransporteurs } = await supabase
    .from('transporteur_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'verified')

  // Stat 4: Active cities
  const { data: cityData } = await supabase
    .from('users')
    .select('ville')
    .not('ville', 'is', null)

  const activeCities = new Set((cityData ?? []).map(u => u.ville)).size

  // Revenue chart data — weekly (last 4 weeks)
  const weeklyData = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - i * 7)

    const { data: weekMatchings } = await supabase
      .from('matchings')
      .select('prix_final')
      .in('statut', ['accepté', 'completé'])
      .not('prix_final', 'is', null)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())

    const weekRevenue = (weekMatchings ?? []).reduce(
      (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
      0
    )
    weeklyData.push({ label: `S-${i}`, value: weekRevenue })
  }

  // Revenue chart data — monthly (last 6 months)
  const monthlyData = []
  const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const { data: monthMatchings } = await supabase
      .from('matchings')
      .select('prix_final')
      .in('statut', ['accepté', 'completé'])
      .not('prix_final', 'is', null)
      .gte('created_at', mStart.toISOString())
      .lt('created_at', mEnd.toISOString())

    const monthRevenue = (monthMatchings ?? []).reduce(
      (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
      0
    )
    monthlyData.push({ label: MONTH_NAMES[mStart.getMonth()], value: monthRevenue })
  }

  // City transactions chart
  const { data: chargesWithCity } = await supabase
    .from('charges')
    .select('ville_depart')

  const cityCountMap: Record<string, number> = {}
  for (const c of chargesWithCity ?? []) {
    const city = c.ville_depart ?? 'Autre'
    cityCountMap[city] = (cityCountMap[city] ?? 0) + 1
  }
  const cityChartData = Object.entries(cityCountMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Vehicle type pie chart
  const { data: vehicleTypes } = await supabase
    .from('transporteur_profiles')
    .select('vehicle_type')
    .eq('verification_status', 'verified')
    .not('vehicle_type', 'is', null)

  const vehicleCountMap: Record<string, number> = {}
  for (const v of vehicleTypes ?? []) {
    const vt = v.vehicle_type ?? 'unknown'
    vehicleCountMap[vt] = (vehicleCountMap[vt] ?? 0) + 1
  }
  const vehicleChartData = Object.entries(vehicleCountMap).map(([key, value]) => ({
    name: VEHICLE_LABELS[key] ?? key,
    value,
  }))

  // Map data: transporteurs grouped by city
  const { data: transporteursWithCity } = await supabase
    .from('transporteur_profiles')
    .select('vehicle_type, users(nom, ville)')
    .eq('verification_status', 'verified')

  const mapCityMap: Record<string, { count: number; transporteurs: { nom: string; vehicle_type: string | null }[] }> = {}
  for (const tp of transporteursWithCity ?? []) {
    const user = tp.users as unknown as { nom: string; ville: string } | null
    if (!user?.ville) continue
    if (!mapCityMap[user.ville]) {
      mapCityMap[user.ville] = { count: 0, transporteurs: [] }
    }
    mapCityMap[user.ville].count++
    mapCityMap[user.ville].transporteurs.push({ nom: user.nom, vehicle_type: tp.vehicle_type })
  }
  const mapData = Object.entries(mapCityMap).map(([city, data]) => ({ city, ...data }))

  const statCards = [
    { label: 'Transactions ce mois', value: transactionsThisMonth ?? 0, color: '#1D4ED8' },
    { label: 'Commissions (MAD)', value: `${totalRevenue}`, color: '#059669' },
    { label: 'Transporteurs actifs', value: activeTransporteurs ?? 0, color: '#D97706' },
    { label: 'Villes actives', value: activeCities, color: '#7C3AED' },
  ]

  return (
    <div className="space-y-4 pb-8">
      <StatsCards cards={statCards} />
      <RevenueChart weeklyData={weeklyData} monthlyData={monthlyData} />
      <CityTransactionsChart data={cityChartData} />
      <VehicleTypeChart data={vehicleChartData} />
      <TransporteurMap cityData={mapData} />
    </div>
  )
}
