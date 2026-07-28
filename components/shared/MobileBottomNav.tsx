"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { getNavigationItems } from "@/components/shared/navigation"
import type { UserRole } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export function MobileBottomNav({ role = "SUPER_ADMIN" }: { role?: UserRole }) {
  const pathname = usePathname()
  const items = getNavigationItems(role).slice(0, 4)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t border-border bg-card/95 px-3 py-2 backdrop-blur-md md:hidden">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs transition-all duration-150",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <item.icon className="size-5" />
            <span className="mt-1">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
