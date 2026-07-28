"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const chartData = [
  { name: "Mon", value: 520 },
  { name: "Tue", value: 610 },
  { name: "Wed", value: 740 },
  { name: "Thu", value: 680 },
  { name: "Fri", value: 820 },
  { name: "Sat", value: 980 },
  { name: "Sun", value: 900 },
]

export function PremiumChart() {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f3d91" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0f3d91" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 16, borderColor: "rgba(148,163,184,0.35)" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0f3d91"
            fill="url(#premiumGradient)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
