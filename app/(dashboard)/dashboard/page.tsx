import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"

const kpis = [
  { label: "Active Agents", value: "482", delta: "+12%" },
  { label: "Policies Issued", value: "1,428", delta: "+4.8%" },
  { label: "Premiums Collected", value: "₹24.8M", delta: "+6.7%" },
]

const chartData = [
  { name: "Mon", value: 520 },
  { name: "Tue", value: 610 },
  { name: "Wed", value: 740 },
  { name: "Thu", value: 680 },
  { name: "Fri", value: 820 },
  { name: "Sat", value: 980 },
  { name: "Sun", value: 900 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back, LIC team."
        description="This is the foundation dashboard for the enterprise management shell."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {kpis.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <Card className="rounded-[2rem] border border-border bg-card p-6 shadow-sm shadow-black/5">
        <CardHeader>
          <CardTitle>Premium collection trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[340px] px-1 pt-4">
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
        </CardContent>
      </Card>
      <EmptyState
        title="Ready for your next module"
        description="Customer, policy, premium and commission modules will follow the base dashboard shell." 
        actionLabel="Explore login"
        actionHref="/login"
      />
    </div>
  )
}
