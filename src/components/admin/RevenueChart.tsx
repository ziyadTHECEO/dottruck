'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  label: string
  value: number
}

interface Props {
  weeklyData: DataPoint[]
  monthlyData: DataPoint[]
}

export default function RevenueChart({ weeklyData, monthlyData }: Props) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const data = view === 'weekly' ? weeklyData : monthlyData

  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-nardo">Commissions</p>
        <div className="flex gap-1">
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
              view === 'weekly' ? 'bg-accent text-white' : 'text-muted bg-surface'
            }`}
          >
            Hebdo
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
              view === 'monthly' ? 'bg-accent text-white' : 'text-muted bg-surface'
            }`}
          >
            Mensuel
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v} MAD`, 'Commission']} />
          <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
