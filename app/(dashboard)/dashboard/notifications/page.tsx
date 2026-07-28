import { EmptyState } from "@/components/shared/EmptyState"

export default function NotificationsPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        title="Notifications coming soon"
        description="Alerts, in-app reminders and alert history will be available here for your role."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    </div>
  )
}
