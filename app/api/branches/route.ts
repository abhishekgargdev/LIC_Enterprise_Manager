import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { Region } from "@/models/Region"
import { User } from "@/models/User"

export async function GET() {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const filter: any = {}
  if (session.role === "REGIONAL_ADMIN") {
    filter.region = session.region
  }
  if (session.role === "BRANCH_MANAGER" || session.role === "DEVELOPMENT_OFFICER" || session.role === "AGENT") {
    filter.code = session.branch
  }

  const branches = await Branch.find(filter).populate("branchManager", "name email role").lean()
  return NextResponse.json({ success: true, data: branches })
}

export async function POST(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let user
  try {
    user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])
  } catch (error) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { name, code, region, branchManagerId, address, isActive = true } = body || {}

  if (!name || !code || !region) {
    return NextResponse.json({ success: false, error: "Name, code, and region are required." }, { status: 400 })
  }

  if (user.role === "REGIONAL_ADMIN" && region.toUpperCase() !== user.region) {
    return NextResponse.json({ success: false, error: "Regional admins may only create branches in their own region." }, { status: 403 })
  }

  const existing = await Branch.findOne({ code: code.toUpperCase() })
  if (existing) {
    return NextResponse.json({ success: false, error: "Branch code already exists." }, { status: 409 })
  }

  const branchData: any = {
    name,
    code: code.toUpperCase(),
    region: region.toUpperCase(),
    address,
    isActive,
  }

  if (branchManagerId) {
    const manager = await User.findById(branchManagerId)
    if (manager) {
      branchData.branchManager = manager._id
    }
  }

  const branch = await Branch.create(branchData)
  return NextResponse.json({ success: true, data: branch })
}
