import {
  Bell,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
  Users2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { UserRole } from "@/lib/permissions"

export type RouteHref =
  | "/dashboard"
  | "/dashboard/customers"
  | "/dashboard/policies"
  | "/dashboard/leads"
  | "/dashboard/notifications"
  | "/dashboard/team"

export type NavigationItem = {
  title: string
  href: RouteHref
  icon: LucideIcon
  roles: UserRole[]
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "SUPER_ADMIN",
      "REGIONAL_ADMIN",
      "BRANCH_MANAGER",
      "DEVELOPMENT_OFFICER",
      "AGENT",
    ],
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
  },
  {
    title: "Policies",
    href: "/dashboard/policies",
    icon: FileText,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Sparkles,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"],
  },
  {
    title: "Claims",
    href: "/dashboard/notifications",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: [
      "SUPER_ADMIN",
      "REGIONAL_ADMIN",
      "BRANCH_MANAGER",
      "DEVELOPMENT_OFFICER",
      "AGENT",
    ],
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users2,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"],
  },
]

export function getNavigationItems(role: UserRole) {
  return navigationItems.filter((item) => item.roles.includes(role))
}
