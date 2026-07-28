import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"
import { Policy } from "@/models/Policy"
import { Customer } from "@/models/Customer"
import { Premium } from "@/models/Premium"
import { Claim } from "@/models/Claim"
import { Lead } from "@/models/Lead"
import { Commission } from "@/models/Commission"

export async function GET() {
  try {
    await connectDB()
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { role, userId } = session
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayEnd = new Date(now.setHours(23, 59, 59, 999))

    // Determine target scope filters
    let policyFilter: Record<string, any> = {}
    let customerFilter: Record<string, any> = {}
    let userFilter: Record<string, any> = { isActive: true }
    let leadFilter: Record<string, any> = { agent: userId }

    if (role === "SUPER_ADMIN") {
      // No filter, views all
    } else if (role === "REGIONAL_ADMIN") {
      const branches = await Branch.find({ region: session.region }).distinct("_id")
      policyFilter = { branch: { $in: branches } }
      customerFilter = { branch: { $in: branches } }
      userFilter = { region: session.region, isActive: true }
    } else if (role === "BRANCH_MANAGER") {
      const branch = await Branch.findOne({ code: session.branch }).select("_id")
      policyFilter = { branch: branch?._id || null }
      customerFilter = { branch: branch?._id || null }
      userFilter = { branch: session.branch, isActive: true }
    } else if (role === "DEVELOPMENT_OFFICER") {
      const teamAgents = await User.find({ manager: userId }).distinct("_id")
      policyFilter = { agent: { $in: teamAgents } }
      customerFilter = { agent: { $in: teamAgents } }
      leadFilter = { agent: { $in: teamAgents } }
    } else if (role === "AGENT") {
      policyFilter = { agent: userId }
      customerFilter = { agent: userId }
      leadFilter = { agent: userId }
    }

    const policyIds = await Policy.find(policyFilter).distinct("_id")
    const agentIds = role === "DEVELOPMENT_OFFICER" 
      ? await User.find({ manager: userId }).distinct("_id")
      : role === "AGENT"
        ? [new mongoose.Types.ObjectId(userId)]
        : []

    // 1. Fetch statistics for Super Admin and Regional Admin
    if (role === "SUPER_ADMIN" || role === "REGIONAL_ADMIN") {
      const branchFilter = role === "REGIONAL_ADMIN" ? { region: session.region } : {}
      
      const totalBranches = await Branch.countDocuments(branchFilter)
      const totalManagers = await User.countDocuments({ role: "BRANCH_MANAGER", ...userFilter })
      const totalAgents = await User.countDocuments({ role: "AGENT", ...userFilter })
      const totalCustomers = await Customer.countDocuments(customerFilter)
      const activePolicies = await Policy.countDocuments({ status: "ACTIVE", ...policyFilter })
      const expiredPolicies = await Policy.countDocuments({ status: { $ne: "ACTIVE" }, ...policyFilter })
      const totalClaims = await Claim.countDocuments({ policy: { $in: policyIds } })

      // Premium paid (Revenue)
      const paidAggregate = await Premium.aggregate([
        { $match: { status: "PAID", policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const totalPaid = paidAggregate[0]?.total || 0

      // Premium pending (DUE or OVERDUE)
      const pendingAggregate = await Premium.aggregate([
        { $match: { status: { $in: ["DUE", "OVERDUE"] }, policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const totalPending = pendingAggregate[0]?.total || 0

      // Charts: Revenue Trend (grouped by last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      sixMonthsAgo.setHours(0, 0, 0, 0)

      const trendAggregate = await Premium.aggregate([
        { $match: { status: "PAID", paidDate: { $gte: sixMonthsAgo }, policy: { $in: policyIds } } },
        { $group: {
            _id: {
              year: { $year: "$paidDate" },
              month: { $month: "$paidDate" }
            },
            amount: { $sum: "$amount" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const revenueTrend = trendAggregate.map(t => ({
        name: `${months[t._id.month - 1]} ${t._id.year}`,
        revenue: t.amount
      }))

      // Charts: Branch leaderboard
      const branchLeaderboard = await Premium.aggregate([
        { $match: { status: "PAID", policy: { $in: policyIds } } },
        { $lookup: { from: "policies", localField: "policy", foreignField: "_id", as: "pol" } },
        { $unwind: "$pol" },
        { $lookup: { from: "branches", localField: "pol.branch", foreignField: "_id", as: "br" } },
        { $unwind: "$br" },
        { $group: { _id: "$br.name", value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        { $limit: 5 }
      ])
      
      const branchChartData = branchLeaderboard.map(b => ({
        name: b._id,
        revenue: b.value
      }))

      return NextResponse.json({
        success: true,
        data: {
          kpis: [
            { label: "Total Branches", value: totalBranches.toString(), href: "/dashboard/branches" },
            { label: "Managers", value: totalManagers.toString(), href: "/dashboard/users?role=BRANCH_MANAGER" },
            { label: "Agents", value: totalAgents.toString(), href: "/dashboard/users?role=AGENT" },
            { label: "Customers", value: totalCustomers.toString(), href: "/dashboard/customers" },
            { label: "Active Policies", value: activePolicies.toString(), href: "/dashboard/policies?status=ACTIVE" },
            { label: "Claims", value: totalClaims.toString(), href: "/dashboard/claims" },
            { label: "Revenue Collection", value: `₹${totalPaid.toLocaleString()}`, href: "/dashboard/premiums" },
            { label: "Pending Premiums", value: `₹${totalPending.toLocaleString()}`, href: "/dashboard/premiums?status=DUE" }
          ],
          revenueTrend,
          branchChartData
        }
      })
    }

    // 2. Fetch statistics for Branch Manager
    if (role === "BRANCH_MANAGER") {
      const totalAgents = await User.countDocuments({ role: "AGENT", branch: session.branch, isActive: true })
      const totalCustomers = await Customer.countDocuments(customerFilter)
      const activePolicies = await Policy.countDocuments({ status: "ACTIVE", ...policyFilter })
      const totalClaims = await Claim.countDocuments({ policy: { $in: policyIds } })

      // Premium collections
      const paidAggregate = await Premium.aggregate([
        { $match: { status: "PAID", policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const totalPaid = paidAggregate[0]?.total || 0

      const pendingAggregate = await Premium.aggregate([
        { $match: { status: { $in: ["DUE", "OVERDUE"] }, policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const totalPending = pendingAggregate[0]?.total || 0

      // Leaderboard: Top agents in their branch
      const topAgents = await Premium.aggregate([
        { $match: { status: "PAID", policy: { $in: policyIds } } },
        { $lookup: { from: "policies", localField: "policy", foreignField: "_id", as: "pol" } },
        { $unwind: "$pol" },
        { $lookup: { from: "users", localField: "pol.agent", foreignField: "_id", as: "ag" } },
        { $unwind: "$ag" },
        { $group: {
            _id: "$ag._id",
            name: { $first: "$ag.name" },
            code: { $first: "$ag.agentCode" },
            premiumCollected: { $sum: "$amount" },
            policiesSold: { $addToSet: "$pol._id" }
          }
        },
        { $project: {
            name: 1,
            code: 1,
            premiumCollected: 1,
            policiesCount: { $size: "$policiesSold" }
          }
        },
        { $sort: { premiumCollected: -1 } },
        { $limit: 5 }
      ])

      return NextResponse.json({
        success: true,
        data: {
          kpis: [
            { label: "Branch Agents", value: totalAgents.toString(), href: "/dashboard/users?role=AGENT" },
            { label: "Branch Customers", value: totalCustomers.toString(), href: "/dashboard/customers" },
            { label: "Active Policies", value: activePolicies.toString(), href: "/dashboard/policies?status=ACTIVE" },
            { label: "Branch Claims", value: totalClaims.toString(), href: "/dashboard/claims" },
            { label: "Premium Collection", value: `₹${totalPaid.toLocaleString()}`, href: "/dashboard/premiums" },
            { label: "Pending Premiums", value: `₹${totalPending.toLocaleString()}`, href: "/dashboard/premiums?status=DUE" }
          ],
          leaderboard: topAgents
        }
      })
    }

    // 3. Fetch statistics for Development Officer (Manager)
    if (role === "DEVELOPMENT_OFFICER") {
      const activeAgentsCount = agentIds.length
      const totalCustomers = await Customer.countDocuments(customerFilter)
      const totalPolicies = await Policy.countDocuments(policyFilter)

      // Today's Premium Collection
      const todayCollectionAggregate = await Premium.aggregate([
        { $match: { status: "PAID", paidDate: { $gte: todayStart, $lte: todayEnd }, policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const todayCollection = todayCollectionAggregate[0]?.total || 0

      // Pending Collection
      const pendingAggregate = await Premium.aggregate([
        { $match: { status: { $in: ["DUE", "OVERDUE"] }, policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const totalPending = pendingAggregate[0]?.total || 0

      // Renewals Due (Count of DUE/OVERDUE premiums)
      const renewalsDueCount = await Premium.countDocuments({
        status: { $in: ["DUE", "OVERDUE"] },
        policy: { $in: policyIds }
      })

      // Manager commissions sum
      const commissionAggregate = await Commission.aggregate([
        { $match: { manager: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$managerAmount" } } }
      ])
      const totalCommission = commissionAggregate[0]?.total || 0

      // Agent performance table (group by Agent under DO)
      const agentPerformance = await User.aggregate([
        { $match: { role: "AGENT", manager: new mongoose.Types.ObjectId(userId) } },
        { $lookup: { from: "policies", localField: "_id", foreignField: "agent", as: "pols" } },
        { $lookup: { from: "commissions", localField: "_id", foreignField: "agent", as: "comm" } },
        { $project: {
            name: 1,
            code: "$agentCode",
            policiesCount: { $size: "$pols" },
            premiumCollected: { $sum: "$pols.premiumAmount" },
            commissionEarned: { $sum: "$comm.agentAmount" }
          }
        },
        { $sort: { premiumCollected: -1 } }
      ])

      return NextResponse.json({
        success: true,
        data: {
          kpis: [
            { label: "My Agents", value: activeAgentsCount.toString(), href: "/dashboard/users?role=AGENT" },
            { label: "Team Customers", value: totalCustomers.toString(), href: "/dashboard/customers" },
            { label: "Policies Sold", value: totalPolicies.toString(), href: "/dashboard/policies" },
            { label: "Today's Collection", value: `₹${todayCollection.toLocaleString()}`, href: "/dashboard/premiums" },
            { label: "Pending Collection", value: `₹${totalPending.toLocaleString()}`, href: "/dashboard/premiums?status=DUE" },
            { label: "Renewals Due", value: renewalsDueCount.toString(), href: "/dashboard/renewals" },
            { label: "My DO Commission", value: `₹${totalCommission.toLocaleString()}`, href: "/dashboard/commissions" }
          ],
          leaderboard: agentPerformance
        }
      })
    }

    // 4. Fetch statistics for Agent
    if (role === "AGENT") {
      const myCustomers = await Customer.countDocuments(customerFilter)
      const myPolicies = await Policy.countDocuments(policyFilter)

      // Due Premium Amount
      const duePremiumAggregate = await Premium.aggregate([
        { $match: { status: { $in: ["DUE", "OVERDUE"] }, policy: { $in: policyIds } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      const duePremiumAmount = duePremiumAggregate[0]?.total || 0

      // Today's Follow-ups count (Leads due today/overdue)
      const followUpCount = await Lead.countDocuments({
        agent: userId,
        stage: { $nin: ["CONVERTED", "LOST"] },
        nextFollowUpDate: { $lte: todayEnd }
      })

      // My Commissions
      const commissionAggregate = await Commission.aggregate([
        { $match: { agent: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: "$agentAmount" } } }
      ])
      const totalCommission = commissionAggregate[0]?.total || 0

      // New Leads count
      const newLeadsCount = await Lead.countDocuments({
        agent: userId,
        stage: "NEW"
      })

      // Expired/Lapsed Policies count
      const lapsedCount = await Policy.countDocuments({
        agent: userId,
        status: "LAPSED"
      })

      // Action Lists: Renewals due (up to 5)
      const renewalsList = await Premium.find({
        status: { $in: ["DUE", "OVERDUE"] },
        policy: { $in: policyIds }
      })
      .populate("policy", "policyNumber planName")
      .sort({ dueDate: 1 })
      .limit(5)
      .lean()

      const parsedRenewals = await Promise.all(renewalsList.map(async (r: any) => {
        const fullPolicy = await Policy.findById(r.policy._id).populate("customer", "name")
        return {
          id: r._id,
          policyNumber: r.policy.policyNumber,
          planName: r.policy.planName,
          customerName: fullPolicy?.customer?.name || "—",
          amount: r.amount,
          dueDate: r.dueDate,
          status: r.status
        }
      }))

      // Action Lists: Follow-ups due today (up to 5)
      const followupsList = await Lead.find({
        agent: userId,
        stage: { $nin: ["CONVERTED", "LOST"] },
        nextFollowUpDate: { $lte: todayEnd }
      })
      .sort({ nextFollowUpDate: 1 })
      .limit(5)
      .lean()

      const parsedFollowups = followupsList.map((l: any) => ({
        id: l._id,
        name: l.name,
        mobile: l.mobile,
        stage: l.stage,
        nextFollowUpDate: l.nextFollowUpDate
      }))

      return NextResponse.json({
        success: true,
        data: {
          kpis: [
            { label: "My Customers", value: myCustomers.toString(), href: "/dashboard/customers" },
            { label: "My Policies", value: myPolicies.toString(), href: "/dashboard/policies" },
            { label: "My Commissions", value: `₹${totalCommission.toLocaleString()}`, href: "/dashboard/commissions" },
            { label: "Due Premiums", value: `₹${duePremiumAmount.toLocaleString()}`, href: "/dashboard/premiums?status=DUE" },
            { label: "Follow-ups Today", value: followUpCount.toString(), href: "/dashboard/leads" },
            { label: "New Leads", value: newLeadsCount.toString(), href: "/dashboard/leads" },
            { label: "Lapsed Policies", value: lapsedCount.toString(), href: "/dashboard/policies?status=LAPSED" }
          ],
          renewals: parsedRenewals,
          followups: parsedFollowups
        }
      })
    }

    return NextResponse.json({ success: false, error: "Invalid role." }, { status: 400 })

  } catch (error: any) {
    console.error("Dashboard summary error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
