import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Notification } from "@/models/Notification"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const notification = await Notification.findOne({
    _id: id,
    recipient: session.userId,
  })

  if (!notification) {
    return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 })
  }

  notification.isRead = true
  notification.readAt = new Date()
  await notification.save()

  return NextResponse.json({ success: true, data: notification })
}
