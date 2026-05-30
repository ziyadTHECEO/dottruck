interface StatCard {
  label: string
  value: string | number
  color: string
}

export default function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4">
          <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          <p className="text-xs text-muted mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
