import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { Region } from "@/models/Region"
import { User } from "@/models/User"

export async function GET() {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const filter = session.role === "SUPER_ADMIN" ? {} : { code: session.region }
  const regions = await Region.find(filter).populate("regionalAdmin", "name email role").lean()

  return NextResponse.json({ success: true, data: regions })
}

export async function POST(request: Request) {
  await connectDB()
  const session = await getSession()
  try {
    requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])
  } catch (error) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { name, code, regionalAdminId, isActive = true } = body || {}

  if (!name || !code) {
    return NextResponse.json({ success: false, error: "Name and code are required." }, { status: 400 })
  }

  if (session.role === "REGIONAL_ADMIN" && code.toUpperCase() !== session.region) {
    return NextResponse.json({ success: false, error: "Regional admins may only create their own region." }, { status: 403 })
  }

  const existing = await Region.findOne({ code: code.toUpperCase() })
  if (existing) {
    return NextResponse.json({ success: false, error: "Region code already exists." }, { status: 409 })
  }

  const regionData: any = {
    name,
    code: code.toUpperCase(),
    isActive,
  }

  if (regionalAdminId) {
    const admin = await User.findById(regionalAdminId)
    if (admin) {
      regionData.regionalAdmin = admin._id
    }
  }

  const region = await Region.create(regionData)
  return NextResponse.json({ success: true, data: region })
}
