import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Task } from "@/models/Task"
import { User } from "@/models/User"

async function permittedAssignees(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.role === "SUPER_ADMIN") return User.find({ role: "AGENT", isActive: true }).distinct("_id")
  if (session.role === "REGIONAL_ADMIN") return User.find({ role: "AGENT", region: session.region, isActive: true }).distinct("_id")
  if (session.role === "BRANCH_MANAGER") return User.find({ role: "AGENT", branch: session.branch, isActive: true }).distinct("_id")
  if (session.role === "DEVELOPMENT_OFFICER") return User.find({ role: "AGENT", manager: session.userId, isActive: true }).distinct("_id")
  return [session.userId]
}

export async function GET() {
  await connectDB(); const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const assignees = await permittedAssignees(session)
  const filter = session.role === "AGENT" ? { assignedTo: session.userId } : { $or: [{ assignedBy: session.userId }, { assignedTo: { $in: assignees } }] }
  const tasks = await Task.find(filter).populate("assignedTo", "name email").populate("assignedBy", "name").populate("relatedCustomer", "name").populate("relatedLead", "name").sort({ dueDate: 1 }).lean()
  return NextResponse.json({ success: true, data: tasks })
}

export async function POST(request: Request) {
  await connectDB(); const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const body = await request.json(); const assignedTo = body.assignedTo || session.userId
  if (!body.title || !body.dueDate) return NextResponse.json({ success: false, error: "Title and due date are required." }, { status: 400 })
  if (session.role === "AGENT" && assignedTo !== session.userId) return NextResponse.json({ success: false, error: "Agents can only create tasks for themselves." }, { status: 403 })
  const permitted = (await permittedAssignees(session)).map(String)
  if (!permitted.includes(String(assignedTo))) return NextResponse.json({ success: false, error: "You can only assign tasks to agents in your team." }, { status: 403 })
  const task = await Task.create({ title: body.title, description: body.description, assignedTo, assignedBy: session.userId, relatedCustomer: body.relatedCustomer || null, relatedLead: body.relatedLead || null, dueDate: body.dueDate, priority: body.priority || "MEDIUM" })
  return NextResponse.json({ success: true, data: task })
}
