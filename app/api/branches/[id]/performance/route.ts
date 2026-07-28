import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { Policy } from "@/models/Policy"
import { Premium } from "@/models/Premium"
import { Claim } from "@/models/Claim"
import { User } from "@/models/User"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const session = await getSession()
  const { id } = await params
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const branch = await Branch.findById(id).populate("branchManager", "name email").lean()
  if (!branch) return NextResponse.json({ success: false, error: "Branch not found" }, { status: 404 })
  if ((session.role === "REGIONAL_ADMIN" && branch.region !== session.region) || (session.role === "BRANCH_MANAGER" && branch.code !== session.branch)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  if (!["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER"].includes(session.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), 1)
  const policies = await Policy.find({ branch: branch._id }).select("_id agent premiumAmount status startDate").lean()
  const ids = policies.map((policy) => policy._id)
  const premiums = await Premium.find({ policy: { $in: ids }, status: "PAID" }).select("policy amount paidDate").lean()
  const due = await Premium.countDocuments({ policy: { $in: ids }, dueDate: { $gte: start, $lte: now } })
  const paidThisMonth = premiums.filter((item) => item.paidDate && item.paidDate >= start)
  const paidPolicyIds = new Set(paidThisMonth.map((item) => item.policy.toString()))
  const totalByAgent = new Map<string, number>()
  for (const premium of premiums) {
    const policy = policies.find((item) => item._id.toString() === premium.policy.toString())
    if (policy) totalByAgent.set(policy.agent.toString(), (totalByAgent.get(policy.agent.toString()) || 0) + premium.amount)
  }
  const agentIds = [...totalByAgent.keys()]
  const agents = await User.find({ _id: { $in: agentIds } }).select("name agentCode").lean()
  const monthTrend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { month: date.toLocaleString("en", { month: "short" }), total: premiums.filter((p) => p.paidDate && p.paidDate.getFullYear() === date.getFullYear() && p.paidDate.getMonth() === date.getMonth()).reduce((sum, p) => sum + p.amount, 0) }
  })
  return NextResponse.json({ success: true, data: { branch, stats: { totalPolicies: policies.length, premiumCollected: paidThisMonth.reduce((sum, item) => sum + item.amount, 0), collectionRate: due ? Math.round((paidPolicyIds.size / due) * 100) : 0, renewalRate: policies.length ? Math.round((policies.filter((p) => p.status === "ACTIVE").length / policies.length) * 100) : 0, claimCount: await Claim.countDocuments({ policy: { $in: ids } }) }, trend: monthTrend, topAgents: agents.map((agent) => ({ ...agent, premium: totalByAgent.get(agent._id.toString()) || 0 })).sort((a, b) => b.premium - a.premium), users: await User.find({ branch: branch.code }).select("name email role isActive").lean() } })
}
