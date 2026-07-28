import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { buildAccessFilter, canCreateRole, type UserRole } from "@/lib/permissions"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"
import { notify } from "@/lib/notifications"
import { logAction } from "@/lib/audit"

const roles: UserRole[] = ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"]

function temporaryPassword() {
  return `LIC-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}!`
}

async function nextCode(role: UserRole) {
  const year = new Date().getFullYear()
  const field = role === "AGENT" ? "agentCode" : "employeeCode"
  const prefix = role === "AGENT" ? "AGT" : "EMP"
  const latest = await User.findOne({ [field]: new RegExp(`^${prefix}-${year}-`) })
    .sort({ [field]: -1 })
    .select(field)
    .lean() as Record<string, string> | null
  const previous = latest?.[field]?.split("-").at(-1)
  return `${prefix}-${year}-${String((Number(previous) || 0) + 1).padStart(4, "0")}`
}

export async function GET(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter: Record<string, unknown> = {}
  const role = searchParams.get("role")
  const branch = searchParams.get("branch")
  const manager = searchParams.get("manager")
  const status = searchParams.get("status")
  const search = searchParams.get("search")?.trim()
  if (role && roles.includes(role as UserRole)) filter.role = role
  if (branch) filter.branch = branch.toUpperCase()
  if (manager) filter.manager = manager
  if (status === "active") filter.isActive = true
  if (status === "inactive") filter.isActive = false
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { employeeCode: { $regex: search, $options: "i" } }, { agentCode: { $regex: search, $options: "i" } }]

  // Explicitly scope every directory query through the central permission helper.
  const scopedFilter = buildAccessFilter({ role: session.role, region: session.region, branch: session.branch, manager: session.manager, agent: session.userId }, filter) as any
  if (session.role === "DEVELOPMENT_OFFICER") scopedFilter.manager = session.userId
  if (session.role === "AGENT") scopedFilter._id = session.userId
  const users = await User.find(scopedFilter).select("-passwordHash").populate("manager", "name role").sort({ createdAt: -1 }).lean()
  return NextResponse.json({ success: true, data: users, meta: { creatableRoles: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"].filter((item) => canCreateRole(session, item as UserRole)) } })
}

export async function POST(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const { name, email, phone, role, branch: suppliedBranch, managerId } = body ?? {}
  if (!name || !email || !role || !roles.includes(role)) return NextResponse.json({ success: false, error: "Name, email, and a valid role are required." }, { status: 400 })
  if (!canCreateRole(session, role)) return NextResponse.json({ success: false, error: "You cannot create this role." }, { status: 403 })

  let branch = suppliedBranch?.toUpperCase()
  let manager: { _id: unknown; branch?: string } | string | null = null
  if (session.role === "BRANCH_MANAGER" || session.role === "DEVELOPMENT_OFFICER") branch = session.branch
  if (session.role === "DEVELOPMENT_OFFICER") manager = session.userId
  if (role === "AGENT") {
    const selectedManager = manager || managerId
    if (!selectedManager) return NextResponse.json({ success: false, error: "An agent requires a development officer." }, { status: 400 })
    manager = await User.findOne({ _id: selectedManager, role: "DEVELOPMENT_OFFICER", isActive: true })
    if (!manager) return NextResponse.json({ success: false, error: "Selected manager is not an active development officer." }, { status: 400 })
    branch = manager.branch
  }
  if ((role === "DEVELOPMENT_OFFICER" || role === "BRANCH_MANAGER") && !branch) return NextResponse.json({ success: false, error: "This role requires a branch." }, { status: 400 })
  const branchRecord = branch ? await Branch.findOne({ code: branch, isActive: true }) : null
  if (branch && !branchRecord) return NextResponse.json({ success: false, error: "Choose an active branch." }, { status: 400 })
  if (session.role === "REGIONAL_ADMIN" && branchRecord?.region !== session.region) return NextResponse.json({ success: false, error: "You may only create users in your region." }, { status: 403 })
  if (session.role === "BRANCH_MANAGER" && branch !== session.branch) return NextResponse.json({ success: false, error: "You may only create users in your branch." }, { status: 403 })

  const initialPassword = temporaryPassword()
  const code = await nextCode(role)
  try {
    const managerId = typeof manager === "string" ? manager : manager?._id
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), phone, role, branch, region: branchRecord?.region, manager: managerId || undefined, passwordHash: await hash(initialPassword, 12), joiningDate: new Date(), isActive: true, ...(role === "AGENT" ? { agentCode: code } : { employeeCode: code }) })
    if (role === "AGENT" && managerId) {
      await notify(managerId.toString(), "NEW_ASSIGNMENT", {
        title: "New Agent Assignment",
        message: `Agent ${user.name} has been assigned to you.`,
        link: "/dashboard/team",
        relatedId: user._id.toString()
      })
    }
    await logAction(session, "CREATED_USER", "User", user._id.toString(), null, { name: user.name, email: user.email, role: user.role, branch: user.branch }, request)
    return NextResponse.json({ success: true, data: user.toObject(), temporaryPassword: initialPassword })
  } catch (error: unknown) {
    if (error?.code === 11000) return NextResponse.json({ success: false, error: "A user with that email already exists." }, { status: 409 })
    throw error
  }
}
