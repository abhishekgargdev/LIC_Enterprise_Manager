import type { Session } from "@/lib/auth"
import type { UserRole } from "@/lib/permissions"

export function canAccessBranch(user: Session, branchId: string): boolean {
  if (user.role === "SUPER_ADMIN") return true
  if (user.role === "REGIONAL_ADMIN") return true
  if (user.role === "BRANCH_MANAGER" && user.branch === branchId) return true
  return false
}

export function canAccessAgent(user: Session, agentId: string, agentManagerId?: string): boolean {
  if (user.role === "SUPER_ADMIN") return true
  if (user.role === "REGIONAL_ADMIN") return true
  if (user.role === "BRANCH_MANAGER") return true
  if (user.role === "DEVELOPMENT_OFFICER" && (user.manager === agentManagerId || user.userId === agentManagerId)) return true
  if (user.role === "AGENT" && user.userId === agentId) return true
  return false
}

export function getVisibleUserIds(user: Session): string[] {
  if (!user.userId) return []
  if (user.role === "AGENT") return [user.userId]
  return [] // DEVELOPMENT_OFFICER and above would have their team filtered at query level
}

export function buildUserAccessFilter(user: Session | null) {
  if (!user) {
    return { isActive: true }
  }

  if (user.role === "SUPER_ADMIN") {
    return {}
  }

  if (user.role === "REGIONAL_ADMIN" && user.region) {
    return { region: user.region }
  }

  if (user.role === "BRANCH_MANAGER" && user.branch) {
    return { branch: user.branch }
  }

  if (user.role === "DEVELOPMENT_OFFICER" && user.userId) {
    return {
      $or: [{ manager: user.userId }, { _id: user.userId }],
    }
  }

  if (user.role === "AGENT" && user.userId) {
    return { _id: user.userId }
  }

  return { isActive: true }
}
