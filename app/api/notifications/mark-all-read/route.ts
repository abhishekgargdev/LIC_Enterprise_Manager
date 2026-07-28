import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Notification } from "@/models/Notification"

export async function POST() {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await Notification.updateMany(
    { recipient: session.userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )

  return NextResponse.json({ success: true })
}
