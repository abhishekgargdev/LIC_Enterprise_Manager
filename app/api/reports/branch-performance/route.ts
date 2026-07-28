import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { getScopedFilters } from "@/lib/reports-helper"

export async function GET(request: Request) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { fromDate, toDate, branchIds } = await getScopedFilters(session, searchParams)

    const matchStage: Record<string, any> = {}
    if (branchIds.length > 0) {
      matchStage._id = { $in: branchIds }
    } else {
      if (session.branch) {
        matchStage.code = session.branch
      }
    }

    const data = await Branch.aggregate([
      { $match: matchStage },
      { $lookup: {
          from: "users",
          let: { branchCode: "$code" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$branch", "$$branchCode"] },
                    { $eq: ["$role", "AGENT"] },
                    { $eq: ["$isActive", true] }
                  ]
                }
              }
            }
          ],
          as: "agents"
        }
      },
      { $lookup: {
          from: "policies",
          let: { branchId: "$_id" },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ["$branch", "$$branchId"] },
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
      { $project: {
          _id: 1,
          branchName: "$name",
          branchCode: "$code",
          totalAgents: { $size: "$agents" },
          totalPolicies: { $size: "$policies" },
          premiumCollected: { $sum: "$policies.premiumAmount" }
        }
      },
      { $sort: { premiumCollected: -1 } }
    ])

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Branch performance report error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
