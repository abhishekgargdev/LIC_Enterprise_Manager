import { HierarchyDashboard } from "@/components/shared/HierarchyDashboard"
import { PageHeader } from "@/components/shared/PageHeader"

async function fetchTree() {
  const res = await fetch("/api/hierarchy/tree", { cache: "no-store" })
  return res.json()
}

export default async function HierarchyPage() {
  const data = await fetchTree()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization hierarchy"
        description="Explore office structure, managers, and agents under your access scope."
      />
      {data.success ? <HierarchyDashboard tree={data.data} /> : <p className="text-sm text-destructive">Unable to load hierarchy.</p>}
    </div>
  )
}
