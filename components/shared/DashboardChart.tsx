"use client"

import dynamic from "next/dynamic"

const PremiumChart = dynamic(
  () => import("@/components/shared/PremiumChart").then((mod) => mod.PremiumChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] rounded-[1.5rem] bg-muted/50 p-6 text-sm text-muted-foreground">
        Loading chart...
      </div>
    ),
  }
)

export function DashboardChart() {
  return <PremiumChart />
}
