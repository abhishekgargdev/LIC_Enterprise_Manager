export type UserRole =
  | "SUPER_ADMIN"
  | "REGIONAL_ADMIN"
  | "BRANCH_MANAGER"
  | "DEVELOPMENT_OFFICER"
  | "AGENT"

export type UserContext = {
  role: UserRole
  region?: string
  branch?: string
  manager?: string
  agent?: string
}

export type AccessScope = Partial<Pick<UserContext, "region" | "branch" | "manager" | "agent">>

/** Roles that may be provisioned by each staff level. Super admins are seeded,
 * rather than provisioned from the day-to-day staff screen. */
export const creatableRoles: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: ["REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
  REGIONAL_ADMIN: ["BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
  BRANCH_MANAGER: ["DEVELOPMENT_OFFICER", "AGENT"],
  DEVELOPMENT_OFFICER: ["AGENT"],
  AGENT: [],
}

export function canCreateRole(user: Pick<UserContext, "role"> | null, role: UserRole) {
  return Boolean(user && creatableRoles[user.role].includes(role))
}

export function hasRole(user: UserContext | null, roles: UserRole | UserRole[]) {
  if (!user) return false
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(user.role)
}

export function canAccess(user: UserContext | null, target: AccessScope) {
  if (!user) return false
  if (user.role === "SUPER_ADMIN") return true

  switch (user.role) {
    case "REGIONAL_ADMIN":
      return Boolean(target.region && user.region && target.region === user.region)
    case "BRANCH_MANAGER":
      return Boolean(target.branch && user.branch && target.branch === user.branch)
    case "DEVELOPMENT_OFFICER":
      return Boolean(
        (target.manager && user.manager && target.manager === user.manager) ||
          (target.agent && user.agent && target.agent === user.agent)
      )
    case "AGENT":
      return Boolean(target.agent && user.agent && target.agent === user.agent)
    default:
      return false
  }
}

export function buildAccessFilter(user: UserContext | null, baseFilter = {}) {
  if (!user) {
    return { ...baseFilter, isActive: true }
  }

  if (user.role === "SUPER_ADMIN") {
    return baseFilter
  }

  switch (user.role) {
    case "REGIONAL_ADMIN":
      return { ...baseFilter, region: user.region }
    case "BRANCH_MANAGER":
      return { ...baseFilter, branch: user.branch }
    case "DEVELOPMENT_OFFICER":
      return {
        ...baseFilter,
        $or: [{ manager: user.manager }, { agent: user.agent }],
      }
    case "AGENT":
      return { ...baseFilter, agent: user.agent }
    default:
      return baseFilter
  }
}
