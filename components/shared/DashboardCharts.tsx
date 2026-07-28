"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ChartDataPoint {
  name: string
  revenue: number
}

interface ChartProps {
  data: ChartDataPoint[]
}

export function RevenueTrendChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No collection data available.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary, #0f3d91)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-primary, #0f3d91)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderRadius: "1rem",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Collection"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-primary, #0f3d91)"
            fill="url(#revenueGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BranchPerformanceChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No branch collection data available.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              borderRadius: "1rem",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Collection"]}
          />
          <Bar
            dataKey="revenue"
            fill="var(--color-accent, #6366f1)"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
