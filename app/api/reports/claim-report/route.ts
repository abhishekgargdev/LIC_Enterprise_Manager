import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Claim } from "@/models/Claim"
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

    const policyFilter: Record<string, any> = {}
    if (branchIds.length > 0) policyFilter.branch = { $in: branchIds }
    if (agentIds.length > 0) policyFilter.agent = { $in: agentIds }

    const policyIds = await Policy.find(policyFilter).distinct("_id")

    const claims = await Claim.find({
      filedDate: { $gte: fromDate, $lte: toDate },
      policy: { $in: policyIds }
    })
    .populate("policy", "policyNumber")
    .populate("customer", "name")
    .sort({ filedDate: -1 })
    .lean()

    const data = claims.map((c: any) => ({
      _id: c._id,
      claimNumber: c.claimNumber,
      policyNumber: c.policy?.policyNumber || "—",
      customerName: c.customer?.name || "—",
      claimType: c.claimType,
      claimAmount: c.claimAmount,
      filedDate: c.filedDate,
      status: c.status
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Claim report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
