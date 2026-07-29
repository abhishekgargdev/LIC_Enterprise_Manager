import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AppSidebar } from "@/components/shared/AppSidebar"
import { MobileBottomNav } from "@/components/shared/MobileBottomNav"
import { DashboardHeader } from "@/components/shared/DashboardHeader"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Collapsible desktop sidebar */}
      <AppSidebar role={session.role} />
      
      {/* Main dashboard frame */}
      <div className="md:ml-80">
        {/* Dynamic theme-aware, bell-enabled header */}
        <DashboardHeader role={session.role} />
        
        {/* Main page workspace with padding to prevent mobile bottom-nav overlap */}
        <main className="min-h-[calc(100vh-5rem)] px-4 py-6 md:px-8 pb-24 md:pb-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile-only bottom navigation bar */}
      <MobileBottomNav role={session.role} />
    </div>
  )
}
