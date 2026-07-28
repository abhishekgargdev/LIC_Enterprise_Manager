import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const user = session

  const branch = await Branch.findById(params.id).populate("branchManager", "name email role").lean()
  if (!branch) {
    return NextResponse.json({ success: false, error: "Branch not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && branch.region !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }
  if (user.role === "BRANCH_MANAGER" && branch.code !== user.branch) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: branch })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  const user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])

  const branch = await Branch.findById(params.id)
  if (!branch) {
    return NextResponse.json({ success: false, error: "Branch not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && branch.region !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const updates: any = {}
  if (body.name) updates.name = body.name
  if (body.code) updates.code = body.code.toUpperCase()
  if (body.region) updates.region = body.region.toUpperCase()
  if (body.address) updates.address = body.address
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive
  if (body.branchManagerId) {
    const manager = await User.findById(body.branchManagerId)
    if (manager) {
      updates.branchManager = manager._id
    }
  }

  if (body.isActive === false) {
    const activeUsers = await User.countDocuments({ branch: branch.code, isActive: true })
    if (activeUsers > 0) {
      Object.assign(branch, updates)
      await branch.save()
      return NextResponse.json({
        success: true,
        warning: "This branch still has active users under it.",
        data: branch,
      })
    }
  }

  Object.assign(branch, updates)
  await branch.save()

  return NextResponse.json({ success: true, data: branch })
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  const user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])

  const branch = await Branch.findById(params.id)
  if (!branch) {
    return NextResponse.json({ success: false, error: "Branch not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && branch.region !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  await branch.deleteOne()
  return NextResponse.json({ success: true, data: { id: params.id } })
}
