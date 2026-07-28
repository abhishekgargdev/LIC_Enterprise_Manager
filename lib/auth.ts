import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { UserRole } from "@/lib/permissions"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

export type Session = {
  userId: string
  email: string
  name: string
  role: UserRole
  branch?: string
  region?: string
  manager?: string
  iat: number
  exp: number
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return null
    }

    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as Session
  } catch (err) {
    return null
  }
}

export function requireRole(user: Session | null, roles: UserRole | UserRole[]) {
  if (!user) {
    throw new Error("Unauthorized: No session")
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  return user
}
