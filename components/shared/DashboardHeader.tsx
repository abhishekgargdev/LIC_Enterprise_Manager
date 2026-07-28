"use client"

import { Bell } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import type { UserRole } from "@/lib/permissions"

interface DashboardHeaderProps {
  role: UserRole
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-3xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent-foreground">
          Internal Staff Shell
        </div>
        <p className="text-sm text-muted-foreground">Role: {role.replace("_", " ")}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </button>
        <ThemeToggle />
        <div className="hidden items-center gap-3 rounded-3xl border border-border bg-card px-3 py-2 md:flex">
          <Avatar>
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Super Admin</p>
            <p className="text-xs text-muted-foreground">super_admin@lic.local</p>
          </div>
        </div>
      </div>
    </header>
  )
}
