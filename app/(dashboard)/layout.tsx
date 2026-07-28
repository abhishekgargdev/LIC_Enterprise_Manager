import type { UserRole } from "@/lib/permissions"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const role: UserRole = "SUPER_ADMIN"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="md:ml-80">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-3xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent-foreground">
              Internal Staff Shell
            </div>
            <p className="text-sm text-muted-foreground">Role: {role.replace("_", " ")}</p>
          </div>
        </header>
        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
