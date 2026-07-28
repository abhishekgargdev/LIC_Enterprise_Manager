import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Branch } from "@/models/Branch"
import { Policy } from "@/models/Policy"
import { Premium } from "@/models/Premium"
import { Lead } from "@/models/Lead"
import { Customer } from "@/models/Customer"
import { Claim } from "@/models/Claim"
import { User } from "@/models/User"
/* eslint-disable @typescript-eslint/no-explicit-any */

type Event = { id: string; date: string; title: string; type: string; color: string; link: string }
const meta: Record<string, { color: string }> = { PREMIUM_DUE: { color: "#2563eb" }, FOLLOW_UP: { color: "#9333ea" }, BIRTHDAY: { color: "#db2777" }, MATURITY: { color: "#ea580c" }, CLAIM: { color: "#16a34a" } }
export async function GET(request: Request) {
  await connectDB(); const session = await getSession(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const q = new URL(request.url).searchParams, year = Number(q.get("year")), month = Number(q.get("month"))
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return NextResponse.json({ success: false, error: "Valid month and year are required." }, { status: 400 })
  const start = new Date(Date.UTC(year, month - 1, 1)), end = new Date(Date.UTC(year, month, 1))
  const policyScope: Record<string, unknown> = {}, leadScope: Record<string, unknown> = {}, customerScope: Record<string, unknown> = {}
  if (session.role === "AGENT") { policyScope.agent = session.userId; leadScope.agent = session.userId; customerScope.agent = session.userId }
  else if (session.role === "DEVELOPMENT_OFFICER") { const agents = await User.find({ manager: session.userId }).distinct("_id"); policyScope.agent = { $in: agents }; leadScope.agent = { $in: agents }; customerScope.agent = { $in: agents } }
  else if (session.role === "BRANCH_MANAGER" || session.role === "REGIONAL_ADMIN") { const branches = await Branch.find(session.role === "BRANCH_MANAGER" ? { code: session.branch } : { region: session.region }).distinct("_id"); policyScope.branch = { $in: branches }; customerScope.branch = { $in: branches }; const agents = await User.find(session.role === "BRANCH_MANAGER" ? { branch: session.branch } : { region: session.region }).distinct("_id"); leadScope.agent = { $in: agents } }
  const policies = await Policy.find(policyScope).select("_id policyNumber maturityDate").lean(), policyIds = policies.map(p => p._id)
  const [premiums, leads, customers, claims] = await Promise.all([
    Premium.find({ policy: { $in: policyIds }, dueDate: { $gte: start, $lt: end }, status: { $ne: "PAID" } }).populate("policy", "policyNumber").lean(),
    Lead.find({ ...leadScope, nextFollowUpDate: { $gte: start, $lt: end }, stage: { $nin: ["CONVERTED", "LOST"] } }).lean(),
    Customer.find(customerScope).select("name dob").lean(),
    Claim.find({ policy: { $in: policyIds }, $or: [{ filedDate: { $gte: start, $lt: end } }, { settledDate: { $gte: start, $lt: end } }] }).lean(),
  ])
  const events: Event[] = []
  const add = (type: keyof typeof meta, id: string, date: Date, title: string, link: string) => events.push({ id: `${type}-${id}-${date.getTime()}`, date: date.toISOString(), title, type, color: meta[type].color, link })
  premiums.forEach(p => add("PREMIUM_DUE", String(p._id), p.dueDate, `Premium due · ${(p.policy as any)?.policyNumber || "Policy"}`, "/dashboard/premiums"))
  leads.forEach(l => add("FOLLOW_UP", String(l._id), l.nextFollowUpDate!, `Follow up · ${l.name}`, "/dashboard/leads"))
  customers.forEach(c => { const dob = new Date(c.dob); if (dob.getUTCMonth() === month - 1) add("BIRTHDAY", String(c._id), new Date(Date.UTC(year, month - 1, dob.getUTCDate())), `Birthday · ${c.name}`, `/dashboard/customers/${c._id}`) })
  policies.filter(p => p.maturityDate >= start && p.maturityDate < end).forEach(p => add("MATURITY", String(p._id), p.maturityDate, `Policy maturity · ${p.policyNumber}`, `/dashboard/policies/${p._id}`))
  claims.forEach(c => { if (c.filedDate >= start && c.filedDate < end) add("CLAIM", String(c._id), c.filedDate, `Claim filed · ${c.claimNumber}`, `/dashboard/claims/${c._id}`); if (c.settledDate && c.settledDate >= start && c.settledDate < end) add("CLAIM", String(c._id), c.settledDate, `Claim settled · ${c.claimNumber}`, `/dashboard/claims/${c._id}`) })
  return NextResponse.json({ success: true, data: events, legend: meta })
}
