import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { canCreateRole } from "@/lib/permissions"
import { User } from "@/models/User"
import { notify } from "@/lib/notifications"
import { logAction } from "@/lib/audit"

async function accessible(id: string) {
  const session = await getSession()
  if (!session) return { session, user: null }
  const user = await User.findById(id)
  if (!user) return { session, user: null }
  const allowed = session.role === "SUPER_ADMIN" || (session.role === "REGIONAL_ADMIN" && user.region === session.region) || (session.role === "BRANCH_MANAGER" && user.branch === session.branch) || (session.role === "DEVELOPMENT_OFFICER" && user.manager?.toString() === session.userId) || session.userId === id
  return { session, user: allowed ? user : null }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, user } = await accessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!user) return NextResponse.json({ success: false, error: "User not found or forbidden." }, { status: 404 })
  return NextResponse.json({ success: true, data: await user.populate("manager", "name role") })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, user } = await accessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!user) return NextResponse.json({ success: false, error: "User not found or forbidden." }, { status: 404 })
  const body = await request.json(); const updates: Record<string, unknown> = {}
  for (const field of ["name", "phone", "avatarUrl", "isActive"] as const) if (body[field] !== undefined) updates[field] = body[field]
  if (body.role && body.role !== user.role) {
    if (!canCreateRole(session, body.role)) return NextResponse.json({ success: false, error: "You cannot assign this role." }, { status: 403 })
    updates.role = body.role
  }
  if (body.managerId && user.role === "AGENT") {
    if (String(user.manager || "") !== String(body.managerId)) {
      updates.manager = body.managerId
      await notify(body.managerId, "NEW_ASSIGNMENT", {
        title: "New Agent Assignment",
        message: `Agent ${user.name} has been assigned to you.`,
        link: "/dashboard/team",
        relatedId: user._id.toString()
      })
    }
  }
  const oldValue = {
    role: user.role,
    branch: user.branch,
    manager: user.manager ? user.manager.toString() : null,
    isActive: user.isActive
  }

  Object.assign(user, updates); await user.save()

  const newValue = {
    role: user.role,
    branch: user.branch,
    manager: user.manager ? user.manager.toString() : null,
    isActive: user.isActive
  }

  await logAction(session, "UPDATED_USER", "User", user._id.toString(), oldValue, newValue, request)
  return NextResponse.json({ success: true, data: user.toObject() })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, user } = await accessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!user) return NextResponse.json({ success: false, error: "User not found or forbidden." }, { status: 404 })
  if (session.userId === id) return NextResponse.json({ success: false, error: "You cannot deactivate your own account." }, { status: 400 })
  const oldValue = { isActive: user.isActive }
  user.isActive = false; await user.save()
  await logAction(session, "DEACTIVATED_USER", "User", user._id.toString(), oldValue, { isActive: false }, request)
  return NextResponse.json({ success: true, data: { id } })
}
