import { EmptyState } from "@/components/shared/EmptyState"

export default function CustomersPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        title="Customer management coming soon"
        description="Customer lists, hierarchy-aware customer access, and search will be built here."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    </div>
  )
}
