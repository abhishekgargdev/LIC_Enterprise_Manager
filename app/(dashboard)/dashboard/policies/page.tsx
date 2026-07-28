import { PageHeader } from "@/components/shared/PageHeader"
import { PolicyManagement } from "@/components/shared/PolicyManagement"

export default function PoliciesPage() {
  return (
    <div><PageHeader title="Policy management" description="Create and track insurance policy lifecycles." /><PolicyManagement /></div>
  )
}
