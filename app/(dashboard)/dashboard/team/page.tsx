import { PageHeader } from "@/components/shared/PageHeader"
import { UserManagement } from "@/components/shared/UserManagement"

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="User management" description="Create, manage, and reassign staff in your permitted scope." />
      <UserManagement />
    </div>
  )
}
