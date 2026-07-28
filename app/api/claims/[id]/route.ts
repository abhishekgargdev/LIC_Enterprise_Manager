import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Claim } from "@/models/Claim"
import { Policy } from "@/models/Policy"
import { PolicyHistory } from "@/models/PolicyHistory"
import { User } from "@/models/User"
import { notify } from "@/lib/notifications"
import { logAction } from "@/lib/audit"

const next: Record<string, string[]> = { PENDING: ["UNDER_REVIEW"], UNDER_REVIEW: ["APPROVED", "REJECTED"], APPROVED: ["SETTLED"], REJECTED: [], SETTLED: [] }

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const claim = await Claim.findById(id)
    .populate({
      path: "policy",
      populate: [
        { path: "customer", select: "name" },
        { path: "agent", select: "name" },
        { path: "manager", select: "name" },
        { path: "branch", select: "name" }
      ]
    })
    .populate("customer")
    .populate("filedBy", "name role")
    .populate("reviewedBy", "name role")

  if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: claim })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const session = await getSession()
  const { id } = await params
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const claim = await Claim.findById(id)
  if (!claim) return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 })

  if (body.status && !next[claim.status].includes(body.status)) {
    return NextResponse.json({ success: false, error: `Invalid claim status transition from ${claim.status} to ${body.status}.` }, { status: 400 })
  }

  if (body.status && ["APPROVED", "REJECTED", "SETTLED"].includes(body.status) && !["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER"].includes(session.role)) {
    return NextResponse.json({ success: false, error: "Only branch managers and above can approve, reject, or settle claims." }, { status: 403 })
  }

  if (body.status === "REJECTED" && !body.rejectionReason) {
    return NextResponse.json({ success: false, error: "A rejection reason is required." }, { status: 400 })
  }

  const oldValue = {
    status: claim.status,
    description: claim.description,
    approvedAmount: claim.approvedAmount,
    rejectionReason: claim.rejectionReason,
  }

  if (body.status) {
    claim.status = body.status
    claim.reviewedBy = session.userId

    if (body.status === "APPROVED") {
      claim.approvedAmount = body.approvedAmount !== undefined ? body.approvedAmount : claim.claimAmount
    } else if (body.status === "REJECTED") {
      claim.rejectionReason = body.rejectionReason
    } else if (body.status === "SETTLED") {
      claim.settledDate = new Date()
    }
  }

  if (body.description !== undefined) {
    claim.description = body.description
  }

  await claim.save()

  const newValue = {
    status: claim.status,
    description: claim.description,
    approvedAmount: claim.approvedAmount,
    rejectionReason: claim.rejectionReason,
  }

  await logAction(session, "UPDATED_CLAIM", "Claim", claim._id.toString(), oldValue, newValue, request)

  if (body.status) {
    const policy = await Policy.findById(claim.policy)
    const agentId = policy?.agent || claim.filedBy
    
    await notify(agentId.toString(), "CLAIM_STATUS_CHANGE", {
      title: "Claim Status Update",
      message: `Claim ${claim.claimNumber} status has changed to ${body.status}.`,
      link: `/dashboard/claims/${claim._id}`,
      relatedId: claim._id.toString()
    })

    if (body.status === "SETTLED" && policy) {
      const oldStatus = policy.status
      policy.status = "CLAIM_SETTLED"
      await policy.save()

      await PolicyHistory.create({
        policy: policy._id,
        field: "status",
        oldValue: oldStatus,
        newValue: "CLAIM_SETTLED",
        changedBy: session.userId,
        changedAt: new Date()
      })

      const agentUser = await User.findById(policy.agent)
      const managerId = policy.manager || agentUser?.manager

      await notify(policy.agent.toString(), "CLAIM_SETTLED", {
        title: "Claim settled",
        message: `Claim ${claim.claimNumber} for policy ${policy.policyNumber} has been settled.`,
        link: `/dashboard/claims/${claim._id}`,
        relatedId: claim._id.toString(),
        dedupeKey: `claim-settled-agent-${claim._id}`
      })

      if (managerId) {
        await notify(managerId.toString(), "CLAIM_SETTLED", {
          title: "Claim settled",
          message: `Claim ${claim.claimNumber} for policy ${policy.policyNumber} has been settled.`,
          link: `/dashboard/claims/${claim._id}`,
          relatedId: claim._id.toString(),
          dedupeKey: `claim-settled-manager-${claim._id}`
        })
      }
    }
  }

  return NextResponse.json({ success: true, data: claim })
}
