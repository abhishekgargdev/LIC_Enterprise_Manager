import { EmptyState } from "@/components/shared/EmptyState"

export default function PoliciesPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        title="Policies coming soon"
        description="This section will include policy management, commissions, and hierarchy-aware policy access."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    </div>
  )
}
