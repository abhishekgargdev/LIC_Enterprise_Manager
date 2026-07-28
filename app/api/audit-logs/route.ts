import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { AuditLog } from "@/models/AuditLog"
import { User } from "@/models/User"

export async function GET(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const params = new URL(request.url).searchParams
  const filter: Record<string, unknown> = {}
  if (params.get("user")) filter.user = params.get("user")
  if (params.get("entityType")) filter.entityType = params.get("entityType")
  if (params.get("from") || params.get("to")) {
    filter.createdAt = {
      ...(params.get("from") ? { $gte: new Date(params.get("from")!) } : {}),
      ...(params.get("to") ? { $lte: new Date(`${params.get("to")}T23:59:59.999Z`) } : {}),
    }
  }
  if (session.role !== "SUPER_ADMIN") {
    const userScope = session.role === "REGIONAL_ADMIN" ? { region: session.region } : { branch: session.branch }
    const scopedIds = await User.find(userScope).distinct("_id")
    filter.user = params.get("user") ? { $in: scopedIds, $eq: params.get("user") } : { $in: scopedIds }
  }
  const logs = await AuditLog.find(filter).populate("user", "name email role branch region").sort({ createdAt: -1 }).limit(500).lean()
  return NextResponse.json({ success: true, data: logs })
}
