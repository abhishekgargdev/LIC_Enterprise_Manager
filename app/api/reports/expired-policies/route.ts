import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Policy } from "@/models/Policy"
import { getScopedFilters } from "@/lib/reports-helper"

export async function GET(request: Request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { fromDate, toDate, branchIds, agentIds } = await getScopedFilters(session, searchParams)

    const filter: Record<string, any> = {
      status: { $in: ["LAPSED", "EXPIRED"] },
      updatedAt: { $gte: fromDate, $lte: toDate }
    }

    if (branchIds.length > 0) filter.branch = { $in: branchIds }
    if (agentIds.length > 0) filter.agent = { $in: agentIds }

    const policies = await Policy.find(filter)
      .populate("customer", "name")
      .populate("agent", "name")
      .sort({ updatedAt: -1 })
      .lean()

    const data = policies.map((p: any) => ({
      _id: p._id,
      policyNumber: p.policyNumber,
      customerName: p.customer?.name || "—",
      agentName: p.agent?.name || "—",
      planName: p.planName,
      maturityDate: p.maturityDate,
      status: p.status
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Expired policies report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
