import { CommissionRule } from "@/models/CommissionRule"
import { Commission } from "@/models/Commission"
import { Policy } from "@/models/Policy"
import { notify } from "@/lib/notifications"

export async function calculateCommission(premiumId: unknown, policyId: unknown, amount: number) {
  const policy = await Policy.findById(policyId)
  if (!policy) return

  const now = new Date()
  const common = { isActive: true, effectiveFrom: { $lte: now } }
  const rule =
    (await CommissionRule.findOne({ ...common, appliesTo: "PLAN", planName: policy.planName }).sort({ effectiveFrom: -1 })) ||
    (await CommissionRule.findOne({ ...common, appliesTo: "BRANCH", branch: policy.branch }).sort({ effectiveFrom: -1 })) ||
    (await CommissionRule.findOne({ ...common, appliesTo: "GLOBAL" }).sort({ effectiveFrom: -1 }))

  if (!rule) return

  const agentAmount = (amount * rule.agentPercent) / 100
  const managerAmount = (amount * rule.managerPercent) / 100
  const branchAmount = (amount * rule.branchPercent) / 100

  await Commission.updateOne(
    { premium: premiumId },
    {
      $setOnInsert: {
        premium: premiumId,
        policy: policy._id,
        agent: policy.agent,
        manager: policy.manager,
        branch: policy.branch,
        premiumAmount: amount,
        agentAmount,
        managerAmount,
        branchAmount,
        calculatedAt: now,
        status: "PENDING",
      },
    },
    { upsert: true }
  )

  // Notify Agent
  await notify(policy.agent.toString(), "COMMISSION_CREDITED", {
    title: "Commission Credited",
    message: `Commission of ₹${agentAmount.toFixed(2)} credited for policy ${policy.policyNumber}.`,
    link: `/dashboard/commissions`,
    relatedId: policy._id.toString(),
  })

  // Notify Manager if applicable
  if (policy.manager && managerAmount > 0) {
    await notify(policy.manager.toString(), "COMMISSION_CREDITED", {
      title: "Commission Credited",
      message: `Overriding commission of ₹${managerAmount.toFixed(2)} credited for policy ${policy.policyNumber}.`,
      link: `/dashboard/commissions`,
      relatedId: policy._id.toString(),
    })
  }
}
