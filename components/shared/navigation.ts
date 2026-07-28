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
  | "/dashboard/users"
  | "/dashboard/hierarchy"
  | "/dashboard/regions"
  | "/dashboard/branches"
  | "/dashboard/policy-assignment"
  | "/dashboard/premiums"
  | "/dashboard/renewals"
  | "/dashboard/commissions"

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
    href: "/dashboard/users",
    icon: Users2,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER"],
  },
  {
    title: "Hierarchy",
    href: "/dashboard/hierarchy",
    icon: Users,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
  },
  { title: "Premiums", href: "/dashboard/premiums", icon: FileText, roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"] },
  { title: "Renewals", href: "/dashboard/renewals", icon: Bell, roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"] },
  { title: "Commissions", href: "/dashboard/commissions", icon: Sparkles, roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"] },
  { title: "Policy assignment", href: "/dashboard/policy-assignment", icon: Users2, roles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"] },
  {
    title: "Regions",
    href: "/dashboard/regions",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN"],
  },
  {
    title: "Branches",
    href: "/dashboard/branches",
    icon: Bell,
    roles: ["SUPER_ADMIN", "REGIONAL_ADMIN"],
  },
]

export function getNavigationItems(role: UserRole) {
  return navigationItems.filter((item) => item.roles.includes(role))
}
