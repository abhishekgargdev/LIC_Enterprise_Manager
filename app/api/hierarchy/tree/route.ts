import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Region } from "@/models/Region"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"

function safeCount(items: any[]) {
  return items.length
}

export async function GET() {
  await connectDB()
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const regionFilter: any = {}
  const branchFilter: any = {}
  const userScope: any = { role: { $in: ["DEVELOPMENT_OFFICER", "AGENT"] } }

  if (session.role === "REGIONAL_ADMIN") {
    regionFilter.code = session.region
    branchFilter.region = session.region
    userScope.region = session.region
  }

  if (session.role === "BRANCH_MANAGER") {
    branchFilter.code = session.branch
    userScope.branch = session.branch
  }

  if (session.role === "DEVELOPMENT_OFFICER") {
    branchFilter.code = session.branch
    userScope.branch = session.branch
    userScope.$or = [{ manager: session.userId }, { _id: session.userId }]
  }

  if (session.role === "AGENT") {
    branchFilter.code = session.branch
    userScope._id = session.userId
  }

  const [regions, branches, users] = await Promise.all([
    Region.find(regionFilter).lean(),
    Branch.find(branchFilter).populate("branchManager", "name role email").lean(),
    User.find(userScope).populate("manager", "name role").lean(),
  ])

  const usersByBranch = new Map<string, any[]>()
  users.forEach((user) => {
    const branchCode = user.branch ?? "UNKNOWN"
    const current = usersByBranch.get(branchCode) ?? []
    current.push(user)
    usersByBranch.set(branchCode, current)
  })

  const branchesByRegion = new Map<string, any[]>()
  branches.forEach((branch) => {
    const branchRegion = branch.region ?? "UNKNOWN"
    const list = branchesByRegion.get(branchRegion) ?? []
    list.push(branch)
    branchesByRegion.set(branchRegion, list)
  })

  const tree = regions.map((region) => {
    const regionBranches = branchesByRegion.get(region.code) ?? []
    const regionUsers = users.filter((user) => user.region === region.code)
    const activeUsers = regionUsers.filter((user) => user.isActive).length
    const inactiveUsers = regionUsers.length - activeUsers

    return {
      id: region._id,
      name: region.name,
      code: region.code,
      role: "REGION",
      isActive: region.isActive,
      counts: {
        agents: regionUsers.filter((user) => user.role === "AGENT").length,
        active: activeUsers,
        inactive: inactiveUsers,
        customers: 0,
        policies: 0,
      },
      branches: regionBranches.map((branch) => {
        const branchUsers = usersByBranch.get(branch.code) ?? []
        const activeBranchUsers = branchUsers.filter((user) => user.isActive).length
        const inactiveBranchUsers = branchUsers.length - activeBranchUsers
        const managers = branchUsers.filter((user) => user.role === "DEVELOPMENT_OFFICER")
        const agents = branchUsers.filter((user) => user.role === "AGENT")

        return {
          id: branch._id,
          name: branch.name,
          code: branch.code,
          role: "BRANCH",
          region: branch.region,
          isActive: branch.isActive,
          branchManager: branch.branchManager || null,
          counts: {
            agents: agents.length,
            active: activeBranchUsers,
            inactive: inactiveBranchUsers,
            customers: 0,
            policies: 0,
          },
          managers: managers.map((manager) => ({
            id: manager._id,
            name: manager.name,
            role: manager.role,
            isActive: manager.isActive,
            agentCount: agents.filter((agent) => String(agent.manager?._id) === String(manager._id)).length,
            agents: agents
              .filter((agent) => String(agent.manager?._id) === String(manager._id))
              .map((agent) => ({
                id: agent._id,
                name: agent.name,
                role: agent.role,
                isActive: agent.isActive,
              })),
          })),
          agents: agents
            .filter((agent) => !agent.manager)
            .map((agent) => ({
              id: agent._id,
              name: agent.name,
              role: agent.role,
              isActive: agent.isActive,
            })),
        }
      }),
    }
  })

  return NextResponse.json({ success: true, data: tree })
}
