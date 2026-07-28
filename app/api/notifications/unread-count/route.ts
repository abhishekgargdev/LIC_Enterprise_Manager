import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Notification } from "@/models/Notification"

export async function GET() {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const count = await Notification.countDocuments({
    recipient: session.userId,
    isRead: false,
  })

  return NextResponse.json({ success: true, count })
}
