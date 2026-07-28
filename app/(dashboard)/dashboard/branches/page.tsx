import { BranchManagement } from "@/components/shared/BranchManagement"
import { PageHeader } from "@/components/shared/PageHeader"

async function fetchBranches() {
  const res = await fetch("/api/branches", { cache: "no-store" })
  return res.json()
}

export default async function BranchesPage() {
  const data = await fetchBranches()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Branch management"
        description="Create branch offices, assign branch managers, and keep branch status updated."
      />
      {data.success ? <BranchManagement initialBranches={data.data} /> : <p className="text-sm text-destructive">Failed to load branches.</p>}
    </div>
  )
}
