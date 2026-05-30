'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface DataPoint {
  name: string
  value: number
}

const COLORS = ['#1D4ED8', '#059669', '#D97706', '#DC2626', '#7C3AED']

export default function VehicleTypeChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <p className="text-sm font-semibold text-nardo mb-4">Types de véhicules</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
            fontSize={10}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
