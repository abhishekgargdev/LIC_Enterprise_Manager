import { BranchCards } from "@/components/shared/BranchCards"
import { PageHeader } from "@/components/shared/PageHeader"

export default function BranchesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Branches"
        description="Branch operations at a glance. Open a branch to see collections, people, and performance."
      />
      <BranchCards />
    </div>
  )
}
