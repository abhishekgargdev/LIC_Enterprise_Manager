import { EmptyState } from "@/components/shared/EmptyState"

export default function TeamPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        title="Team workspace coming soon"
        description="Team hierarchy, branch assignments and manager dashboards will be available here." 
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    </div>
  )
}
