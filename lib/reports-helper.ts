import mongoose from "mongoose"
import { Branch } from "@/models/Branch"
import { User } from "@/models/User"

export async function getScopedFilters(session: any, searchParams: URLSearchParams) {
  const fromStr = searchParams.get("from")
  const toStr = searchParams.get("to")
  const paramBranch = searchParams.get("branch")
  const paramAgent = searchParams.get("agent")

  const fromDate = fromStr ? new Date(fromStr) : new Date(0)
  const toDate = toStr ? new Date(toStr) : new Date()
  // Ensure toDate includes the entire day
  toDate.setHours(23, 59, 59, 999)

  const { role, userId } = session

  let branchIds: mongoose.Types.ObjectId[] = []
  let agentIds: mongoose.Types.ObjectId[] = []

  // Resolve scoping boundaries based on role
  if (role === "SUPER_ADMIN") {
    if (paramBranch) {
      branchIds = [new mongoose.Types.ObjectId(paramBranch)]
    }
    if (paramAgent) {
      agentIds = [new mongoose.Types.ObjectId(paramAgent)]
    }
  } else if (role === "REGIONAL_ADMIN") {
    // Find branches in region
    const regionalBranches = await Branch.find({ region: session.region }).distinct("_id")
    if (paramBranch && regionalBranches.some(b => b.toString() === paramBranch)) {
      branchIds = [new mongoose.Types.ObjectId(paramBranch)]
    } else {
      branchIds = regionalBranches
    }

    if (paramAgent) {
      const agentUser = await User.findById(paramAgent)
      if (agentUser && agentUser.region === session.region) {
        agentIds = [new mongoose.Types.ObjectId(paramAgent)]
      } else {
        // Force no results if mismatch
        agentIds = [new mongoose.Types.ObjectId()]
      }
    }
  } else if (role === "BRANCH_MANAGER") {
    const branchDoc = await Branch.findOne({ code: session.branch })
    branchIds = branchDoc ? [branchDoc._id] : []

    if (paramAgent) {
      const agentUser = await User.findById(paramAgent)
      if (agentUser && agentUser.branch === session.branch) {
        agentIds = [new mongoose.Types.ObjectId(paramAgent)]
      } else {
        agentIds = [new mongoose.Types.ObjectId()]
      }
    }
  } else if (role === "DEVELOPMENT_OFFICER") {
    // Managed agents
    const teamAgents = await User.find({ manager: userId }).distinct("_id")
    if (paramAgent && teamAgents.some(a => a.toString() === paramAgent)) {
      agentIds = [new mongoose.Types.ObjectId(paramAgent)]
    } else {
      agentIds = teamAgents
    }
  } else if (role === "AGENT") {
    agentIds = [new mongoose.Types.ObjectId(userId)]
  }

  return {
    fromDate,
    toDate,
    branchIds,
    agentIds,
  }
}
