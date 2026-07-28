import { Premium } from "@/models/Premium"
import { Policy } from "@/models/Policy"
import { User } from "@/models/User"
import { notify } from "@/lib/notifications"

export async function runDailyPremiumStatus() {
  const now = new Date()
  const graceDays = Number(process.env.PREMIUM_GRACE_DAYS || 30)

  // Find all premiums that are DUE and overdue (past due date)
  const overdue = await Premium.find({ status: "DUE", dueDate: { $lt: now }, paidDate: null })
  await Premium.updateMany({ _id: { $in: overdue.map((x) => x._id) } }, { $set: { status: "OVERDUE" } })

  // Find missed premiums past the grace period
  const missed = await Premium.find({
    status: { $in: ["DUE", "OVERDUE"] },
    dueDate: { $lt: new Date(now.getTime() - graceDays * 86400000) },
    paidDate: null,
  })

  for (const premium of missed) {
    const policy = await Policy.findByIdAndUpdate(premium.policy, { status: "LAPSED" }, { new: true })
    await Premium.updateOne({ _id: premium._id, status: { $ne: "MISSED" } }, { $set: { status: "MISSED" } })

    if (policy) {
      const agentUser = await User.findById(policy.agent)
      const managerId = policy.manager || agentUser?.manager

      // Notify agent
      await notify(policy.agent.toString(), "POLICY_LAPSED", {
        title: "Policy Lapsed",
        message: `Policy ${policy.policyNumber} has lapsed after the grace period.`,
        link: `/dashboard/policies/${policy._id}`,
        relatedId: policy._id.toString(),
        dedupeKey: `policy-lapsed-agent-${policy._id}`,
      })

      // Notify manager
      if (managerId) {
        await notify(managerId.toString(), "POLICY_LAPSED", {
          title: "Policy Lapsed",
          message: `Policy ${policy.policyNumber} assigned to agent ${agentUser?.name || "Agent"} has lapsed.`,
          link: `/dashboard/policies/${policy._id}`,
          relatedId: policy._id.toString(),
          dedupeKey: `policy-lapsed-manager-${policy._id}`,
        })
      }
    }
  }

  return { overdue: overdue.length, missed: missed.length }
}
