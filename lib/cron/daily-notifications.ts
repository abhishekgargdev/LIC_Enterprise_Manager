import { Premium } from "@/models/Premium"
import { Policy } from "@/models/Policy"
import { Customer } from "@/models/Customer"
import { Lead } from "@/models/Lead"
import { User } from "@/models/User"
import { notify } from "@/lib/notifications"

export async function runDailyNotifications() {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0))
  const todayEnd = new Date(now.setHours(23, 59, 59, 999))
  
  const results = {
    premiumDue: 0,
    premiumOverdue: 0,
    policyExpiring: 0,
    birthdays: 0,
    leadsFollowup: 0,
  }

  // 1. Premium due in N days (default 7)
  const N = Number(process.env.PREMIUM_DUE_DAYS_ALERT || 7)
  const dueHorizon = new Date(todayStart.getTime() + N * 24 * 60 * 60 * 1000)

  const duePremiums = await Premium.find({
    status: "DUE",
    dueDate: { $gte: todayStart, $lte: dueHorizon },
  }).populate({
    path: "policy",
    select: "policyNumber agent manager",
  })

  for (const premium of duePremiums) {
    const policy = premium.policy as any
    if (policy && policy.agent) {
      await notify(policy.agent.toString(), "PREMIUM_DUE", {
        title: "Premium Payment Due",
        message: `Premium installment for policy ${policy.policyNumber} is due on ${new Date(premium.dueDate).toLocaleDateString()}.`,
        link: `/dashboard/policies/${policy._id}`,
        relatedId: premium._id.toString(),
        dedupeKey: `premium-due-${premium._id}`,
      })
      results.premiumDue++
    }
  }

  // 2. Overdue premiums -> notify agent + manager
  const overduePremiums = await Premium.find({
    status: "OVERDUE",
    paidDate: null,
  }).populate({
    path: "policy",
    select: "policyNumber agent manager",
  })

  for (const premium of overduePremiums) {
    const policy = premium.policy as any
    if (policy && policy.agent) {
      const agentUser = await User.findById(policy.agent)
      const managerId = policy.manager || agentUser?.manager

      // Notify agent
      await notify(policy.agent.toString(), "PREMIUM_DUE", {
        title: "Premium Overdue Alert",
        message: `Premium installment for policy ${policy.policyNumber} is overdue.`,
        link: `/dashboard/policies/${policy._id}`,
        relatedId: premium._id.toString(),
        dedupeKey: `premium-overdue-agent-${premium._id}`,
      })

      // Notify manager
      if (managerId) {
        await notify(managerId.toString(), "PREMIUM_DUE", {
          title: "Overdue Premium Alert",
          message: `Premium for policy ${policy.policyNumber} (Agent: ${agentUser?.name || "Agent"}) is overdue.`,
          link: `/dashboard/policies/${policy._id}`,
          relatedId: premium._id.toString(),
          dedupeKey: `premium-overdue-manager-${premium._id}`,
        })
      }
      results.premiumOverdue++
    }
  }

  // 3. Policy expiring (maturity within 30 days) -> notify agent
  const expiryHorizon = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringPolicies = await Policy.find({
    status: "ACTIVE",
    maturityDate: { $gte: todayStart, $lte: expiryHorizon },
  })

  for (const policy of expiringPolicies) {
    if (policy.agent) {
      await notify(policy.agent.toString(), "POLICY_EXPIRING", {
        title: "Policy Nearing Maturity",
        message: `Policy ${policy.policyNumber} will reach maturity on ${new Date(policy.maturityDate).toLocaleDateString()}.`,
        link: `/dashboard/policies/${policy._id}`,
        relatedId: policy._id.toString(),
        dedupeKey: `policy-expiring-${policy._id}`,
      })
      results.policyExpiring++
    }
  }

  // 4. Customer birthday today -> notify agent
  const currentMonth = todayStart.getMonth() + 1
  const currentDay = todayStart.getDate()
  const currentYear = todayStart.getFullYear()

  const birthdayCustomers = await Customer.find({
    isActive: true,
    $expr: {
      $and: [
        { $eq: [{ $month: "$dob" }, currentMonth] },
        { $eq: [{ $dayOfMonth: "$dob" }, currentDay] },
      ],
    },
  })

  for (const customer of birthdayCustomers) {
    if (customer.agent) {
      await notify(customer.agent.toString(), "BIRTHDAY", {
        title: "Customer Birthday Reminder",
        message: `Wish ${customer.name} a happy birthday today!`,
        link: `/dashboard/customers/${customer._id}`,
        relatedId: customer._id.toString(),
        dedupeKey: `birthday-${customer._id}-${currentYear}`,
      })
      results.birthdays++
    }
  }

  // 5. Lead follow-up today or overdue -> notify agent
  const todayString = todayStart.toISOString().split("T")[0]
  const pendingLeads = await Lead.find({
    stage: { $nin: ["CONVERTED", "LOST"] },
    nextFollowUpDate: { $lte: todayEnd },
  })

  for (const lead of pendingLeads) {
    if (lead.agent) {
      await notify(lead.agent.toString(), "LEAD_FOLLOWUP_DUE", {
        title: "Lead Follow-up Due",
        message: `Follow-up is due for lead ${lead.name}.`,
        link: `/dashboard/leads`,
        relatedId: lead._id.toString(),
        dedupeKey: `lead-followup-${lead._id}-${todayString}`,
      })
      results.leadsFollowup++
    }
  }

  return results
}
