import { CustomerManagement } from "@/components/shared/CustomerManagement"
import { PageHeader } from "@/components/shared/PageHeader"

export default function CustomersPage() {
  return (
    <div><PageHeader title="Customer management" description="Manage policyholders in your assigned team or branch." /><CustomerManagement /></div>
  )
}
