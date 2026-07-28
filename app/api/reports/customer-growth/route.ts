import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Customer } from "@/models/Customer"
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
      createdAt: { $gte: fromDate, $lte: toDate }
    }

    if (branchIds.length > 0) filter.branch = { $in: branchIds }
    if (agentIds.length > 0) filter.agent = { $in: agentIds }

    const data = await Customer.aggregate([
      { $match: filter },
      { $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $project: {
          _id: 0,
          date: "$_id",
          customersAdded: "$count"
        }
      },
      { $sort: { date: 1 } }
    ])

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Customer growth report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
