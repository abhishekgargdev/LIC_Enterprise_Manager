import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { User } from "@/models/User"
import { Branch } from "@/models/Branch"
import { AuditLog } from "@/models/AuditLog"

export async function POST(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  let user
  try {
    user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER"])
  } catch (error) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { agentId, newManagerId, newBranchCode } = body || {}

  if (!agentId || !newManagerId || !newBranchCode) {
    return NextResponse.json({ success: false, error: "agentId, newManagerId and newBranchCode are required." }, { status: 400 })
  }

  const agent = await User.findById(agentId)
  const manager = await User.findById(newManagerId)
  const targetBranch = await Branch.findOne({ code: newBranchCode.toUpperCase() })

  if (!agent || agent.role !== "AGENT") {
    return NextResponse.json({ success: false, error: "Agent not found." }, { status: 404 })
  }
  if (!manager || manager.role !== "DEVELOPMENT_OFFICER") {
    return NextResponse.json({ success: false, error: "Target manager must be a development officer." }, { status: 400 })
  }
  if (!targetBranch) {
    return NextResponse.json({ success: false, error: "Target branch not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && targetBranch.region !== user.region) {
    return NextResponse.json({ success: false, error: "Regional admin may only transfer within their region." }, { status: 403 })
  }
  if (user.role === "BRANCH_MANAGER" && targetBranch.code !== user.branch) {
    return NextResponse.json({ success: false, error: "Branch manager may only transfer agents inside their own branch." }, { status: 403 })
  }

  const previousBranch = agent.branch
  agent.branch = targetBranch.code
  agent.manager = manager._id
  agent.region = targetBranch.region
  await agent.save()

  await AuditLog.create({
    actor: user.userId,
    action: "transfer_agent",
    targetType: "User",
    targetId: agent._id.toString(),
    details: {
      fromBranch: previousBranch,
      toBranch: targetBranch.code,
      newManager: manager._id.toString(),
    },
  })

  return NextResponse.json({ success: true, data: { agentId: agent._id.toString() } })
}
