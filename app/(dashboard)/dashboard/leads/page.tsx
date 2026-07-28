import { EmptyState } from "@/components/shared/EmptyState"

export default function LeadsPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        title="Leads module coming soon"
        description="Lead assignments, follow-ups and team visibility will be available here." 
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    </div>
  )
}
