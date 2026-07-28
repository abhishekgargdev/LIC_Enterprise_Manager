import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Premium } from "@/models/Premium"
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

    const premiums = await Premium.find({
      status: "PAID",
      paidDate: { $gte: fromDate, $lte: toDate },
      policy: { $in: policyIds }
    })
    .populate("policy", "policyNumber")
    .sort({ paidDate: -1 })
    .lean()

    const data = premiums.map((r: any) => ({
      _id: r._id,
      receiptNumber: r.receiptNumber || "—",
      policyNumber: r.policy?.policyNumber || "—",
      amountPaid: r.amount + (r.lateFee || 0),
      paidDate: r.paidDate,
      paymentMode: r.paidMode || "—"
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Premium collection report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
