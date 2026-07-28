import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Task } from "@/models/Task"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const session = await getSession(); const { id } = await params
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const task = await Task.findById(id); if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
  const isOwner = task.assignedTo.toString() === session.userId, isAssigner = task.assignedBy.toString() === session.userId
  if (!isOwner && !isAssigner && session.role !== "SUPER_ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  const body = await request.json();
  for (const field of ["title", "description", "dueDate", "priority", "status"] as const) if (body[field] !== undefined) task.set(field, body[field])
  if (body.status === "DONE") task.completedAt = new Date(); else if (body.status) task.completedAt = null
  await task.save(); return NextResponse.json({ success: true, data: task })
}
