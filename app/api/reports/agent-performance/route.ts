import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { User } from "@/models/User"
import { getScopedFilters } from "@/lib/reports-helper"

export async function GET(request: Request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { fromDate, toDate, agentIds } = await getScopedFilters(session, searchParams)

    const matchStage: Record<string, any> = { role: "AGENT", isActive: true }

    if (agentIds.length > 0) {
      matchStage._id = { $in: agentIds }
    } else {
      if (session.role === "BRANCH_MANAGER") {
        matchStage.branch = session.branch
      } else if (session.role === "REGIONAL_ADMIN") {
        matchStage.region = session.region
      }
    }

    const data = await User.aggregate([
      { $match: matchStage },
      { $lookup: {
          from: "policies",
          let: { agentId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$agent", "$$agentId"] },
                    { $gte: ["$startDate", fromDate] },
                    { $lte: ["$startDate", toDate] }
                  ]
                }
              }
            }
          ],
          as: "policies"
        }
      },
      { $lookup: {
          from: "commissions",
          let: { agentId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$agent", "$$agentId"] },
                    { $gte: ["$calculatedAt", fromDate] },
                    { $lte: ["$calculatedAt", toDate] }
                  ]
                }
              }
            }
          ],
          as: "commissions"
        }
      },
      { $project: {
          _id: 1,
          agentName: "$name",
          agentCode: { $ifNull: ["$agentCode", "—"] },
          policiesSold: { $size: "$policies" },
          premiumCollected: { $sum: "$policies.premiumAmount" },
          commissionsEarned: { $sum: "$commissions.agentAmount" }
        }
      },
      { $sort: { premiumCollected: -1 } }
    ])

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Agent performance report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
