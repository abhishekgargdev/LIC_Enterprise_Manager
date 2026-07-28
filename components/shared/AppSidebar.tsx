"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getNavigationItems, type NavigationItem } from "@/components/shared/navigation"
import type { UserRole } from "@/lib/permissions"
import { cn } from "@/lib/utils"

function SidebarLink({ item, active }: { item: NavigationItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-5" />
      <span>{item.title}</span>
    </Link>
  )
}

export function AppSidebar({ role = "SUPER_ADMIN" }: { role?: UserRole }) {
  const pathname = usePathname()
  const items = getNavigationItems(role)

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-80 flex-col gap-6 overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground shadow-sm shadow-black/5 md:flex">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-3xl bg-primary px-4 py-4 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-2xl font-semibold">
            L
          </div>
          <div>
            <p className="text-sm font-semibold">LIC Enterprise</p>
            <p className="text-xs text-primary-foreground/80">Staff management shell</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-sidebar-border bg-background p-4 shadow-sm">
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick links</div>
          <div className="space-y-2">
            {items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={pathname === item.href}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto rounded-[2rem] border border-sidebar-border bg-background px-4 py-4 text-sm shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signed in as</p>
            <p className="font-semibold">{role.replace("_", " ")}</p>
          </div>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>
    </aside>
  )
}
