import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Notification } from "@/models/Notification"

export async function GET(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") || 1)
  const limit = Number(searchParams.get("limit") || 10)
  const type = searchParams.get("type")
  const skip = (page - 1) * limit

  const filter: Record<string, any> = { recipient: session.userId }
  if (type) {
    filter.type = type
  }

  const total = await Notification.countDocuments(filter)
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  return NextResponse.json({
    success: true,
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  })
}
