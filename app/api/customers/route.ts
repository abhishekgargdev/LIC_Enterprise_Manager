import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { customerSchema } from "@/lib/customer-validation"
import { Branch } from "@/models/Branch"
import { Customer } from "@/models/Customer"
import { User } from "@/models/User"

async function scope(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.role === "SUPER_ADMIN") return {}
  if (session.role === "AGENT") return { agent: session.userId }
  if (session.role === "DEVELOPMENT_OFFICER") {
    const agents = await User.find({ manager: session.userId }).distinct("_id")
    return { agent: { $in: agents } }
  }
  if (session.role === "BRANCH_MANAGER") { const branch = await Branch.findOne({ code: session.branch }).select("_id"); return { branch: branch?._id } }
  const branches = await Branch.find({ region: session.region }).distinct("_id")
  return { branch: { $in: branches } }
}

export async function GET(request: Request) {
  await connectDB(); const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url); const search = searchParams.get("search")?.trim(); const status = searchParams.get("status")
  const accessScope = await scope(session); const filter: Record<string, unknown> = { ...accessScope }
  if (status === "active") filter.isActive = true; if (status === "inactive") filter.isActive = false
  if (search) filter.$or = ["name", "mobile", "panNumber", "aadhaarNumber"].map((field) => ({ [field]: { $regex: search, $options: "i" } }))
  const customers = await Customer.find(filter).populate("agent", "name").populate("branch", "name code").sort({ createdAt: -1 }).lean()
  const assignableAgents = session.role === "AGENT" ? [] : await User.find({ role: "AGENT", isActive: true, ...(accessScope.agent ? { _id: accessScope.agent } : {}) }).select("name branch").lean()
  return NextResponse.json({ success: true, data: customers, meta: { assignableAgents } })
}

export async function POST(request: Request) {
  await connectDB(); const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const body = await request.json(); const parsed = customerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 })
  const agent = await User.findById(session.role === "AGENT" ? session.userId : body.agentId)
  if (!agent || agent.role !== "AGENT" || !agent.isActive) return NextResponse.json({ success: false, error: "Choose an active agent." }, { status: 400 })
  const branch = await Branch.findOne({ code: agent.branch, isActive: true })
  if (!branch) return NextResponse.json({ success: false, error: "The agent does not belong to an active branch." }, { status: 400 })
  const permitted = session.role === "SUPER_ADMIN" ||
    (session.role === "AGENT" && agent._id.toString() === session.userId) ||
    (session.role === "DEVELOPMENT_OFFICER" && agent.manager?.toString() === session.userId) ||
    (session.role === "BRANCH_MANAGER" && agent.branch === session.branch) ||
    (session.role === "REGIONAL_ADMIN" && branch.region === session.region)
  if (!permitted) return NextResponse.json({ success: false, error: "You cannot create customers for this agent." }, { status: 403 })
  const duplicate = await Customer.findOne({ branch: branch._id, $or: [{ panNumber: parsed.data.panNumber || "__none__" }, { aadhaarNumber: parsed.data.aadhaarNumber || "__none__" }] })
  if (duplicate) return NextResponse.json({ success: false, error: "A customer with this PAN or Aadhaar already exists in this branch." }, { status: 409 })
  try { const customer = await Customer.create({ ...parsed.data, panNumber: parsed.data.panNumber?.toUpperCase(), agent: agent._id, branch: branch._id }); return NextResponse.json({ success: true, data: customer }) }
  catch (error: unknown) { if ((error as { code?: number }).code === 11000) return NextResponse.json({ success: false, error: "A customer with this PAN or Aadhaar already exists in this branch." }, { status: 409 }); throw error }
}
