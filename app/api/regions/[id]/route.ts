import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession, requireRole } from "@/lib/auth"
import { Region } from "@/models/Region"
import { User } from "@/models/User"
import { User as UserModel } from "@/models/User"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const user = session

  const region = await Region.findById(params.id).populate("regionalAdmin", "name email role").lean()
  if (!region) {
    return NextResponse.json({ success: false, error: "Region not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && region.code !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: region })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  const user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])

  const region = await Region.findById(params.id)
  if (!region) {
    return NextResponse.json({ success: false, error: "Region not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && region.code !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const updates: any = {}

  if (body.name) updates.name = body.name
  if (body.code) updates.code = body.code.toUpperCase()
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive
  if (body.regionalAdminId) {
    const admin = await UserModel.findById(body.regionalAdminId)
    if (admin) {
      updates.regionalAdmin = admin._id
    }
  }

  if (body.isActive === false) {
    const activeUsers = await UserModel.countDocuments({ region: region.code, isActive: true })
    if (activeUsers > 0) {
      region.set({ ...updates })
      await region.save()
      return NextResponse.json({
        success: true,
        warning: "This region still has active users under it.",
        data: region,
      })
    }
  }

  Object.assign(region, updates)
  await region.save()

  return NextResponse.json({ success: true, data: region })
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const params = await context.params
  const session = await getSession()
  const user = requireRole(session, ["SUPER_ADMIN", "REGIONAL_ADMIN"])

  const region = await Region.findById(params.id)
  if (!region) {
    return NextResponse.json({ success: false, error: "Region not found." }, { status: 404 })
  }

  if (user.role === "REGIONAL_ADMIN" && region.code !== user.region) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  await region.deleteOne()
  return NextResponse.json({ success: true, data: { id: params.id } })
}
