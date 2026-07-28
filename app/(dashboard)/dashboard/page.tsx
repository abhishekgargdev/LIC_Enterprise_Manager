import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { DashboardChart } from "@/components/shared/DashboardChart"

const kpis = [
  { label: "Active Agents", value: "482", delta: "+12%" },
  { label: "Policies Issued", value: "1,428", delta: "+4.8%" },
  { label: "Premiums Collected", value: "₹24.8M", delta: "+6.7%" },
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
        <CardContent>
          <DashboardChart />
        </CardContent>
      </Card>
    </div>
  )
}
