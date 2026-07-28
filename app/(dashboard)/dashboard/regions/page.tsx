import { RegionManagement } from "@/components/shared/RegionManagement"
import { PageHeader } from "@/components/shared/PageHeader"

async function fetchRegions() {
  const res = await fetch("/api/regions", { cache: "no-store" })
  return res.json()
}

export default async function RegionsPage() {
  const data = await fetchRegions()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Region management"
        description="Manage regional offices, assign admins, and deactivate regions when the organization changes."
      />
      {data.success ? <RegionManagement initialRegions={data.data} /> : <p className="text-sm text-destructive">Failed to load regions.</p>}
    </div>
  )
}
