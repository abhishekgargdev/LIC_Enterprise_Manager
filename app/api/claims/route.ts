import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Claim } from "@/models/Claim"
import { Policy } from "@/models/Policy"
import { Branch } from "@/models/Branch"
import { logAction } from "@/lib/audit"

async function getPolicyScope(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.role === "SUPER_ADMIN") return {}
  if (session.role === "AGENT") return { agent: session.userId }
  if (session.role === "DEVELOPMENT_OFFICER") return { manager: session.userId }
  if (session.role === "BRANCH_MANAGER") {
    const branch = await Branch.findOne({ code: session.branch }).select("_id")
    return { branch: branch?._id || null }
  }
  // REGIONAL_ADMIN
  const branches = await Branch.find({ region: session.region }).distinct("_id")
  return { branch: { $in: branches } }
}

export async function GET(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const p = new URL(request.url).searchParams
  const pScope = await getPolicyScope(session)
  const policyIds = await Policy.find(pScope).distinct("_id")

  const filter: Record<string, any> = { policy: { $in: policyIds } }

  if (p.get("policyId")) {
    filter.policy = p.get("policyId")
  }
  if (p.get("customerId")) {
    filter.customer = p.get("customerId")
  }
  if (p.get("status")) {
    filter.status = p.get("status")
  }
  if (p.get("type")) {
    filter.claimType = p.get("type")
  }

  const claims = await Claim.find(filter)
    .populate("policy", "policyNumber planName")
    .populate("customer", "name")
    .sort({ filedDate: -1 })
    .lean()

  return NextResponse.json({ success: true, data: claims })
}

export async function POST(request: Request) {
  await connectDB()
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const policy = await Policy.findById(body.policyId)
  if (!policy || !["ACTIVE", "MATURED"].includes(policy.status)) {
    return NextResponse.json({ success: false, error: "Claims can only be filed on active or matured policies." }, { status: 400 })
  }

  const year = new Date().getFullYear()
  const latest = await Claim.findOne({ claimNumber: new RegExp(`^CLM-${year}-`) })
    .sort({ claimNumber: -1 })
    .select("claimNumber")
    .lean() as { claimNumber?: string } | null

  const n = (Number(latest?.claimNumber?.split("-").at(-1)) || 0) + 1
  const claimNumber = `CLM-${year}-${String(n).padStart(5, "0")}`

  const claim = await Claim.create({
    claimNumber,
    policy: policy._id,
    customer: policy.customer,
    claimType: body.claimType,
    claimAmount: body.claimAmount,
    description: body.description,
    filedBy: session.userId,
    status: "PENDING"
  })
  await logAction(session, "CREATED_CLAIM", "Claim", claim._id.toString(), null, { claimNumber, policy: policy._id.toString(), claimType: claim.claimType, claimAmount: claim.claimAmount }, request)

  return NextResponse.json({ success: true, data: claim })
}
