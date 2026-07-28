import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { customerSchema } from "@/lib/customer-validation"
import { Customer } from "@/models/Customer"
import { User } from "@/models/User"
import { Branch } from "@/models/Branch"

async function findAccessible(id: string) {
  const session = await getSession(); if (!session) return { session, customer: null }
  const customer = await Customer.findById(id)
  if (!customer) return { session, customer: null }
  if (session.role === "SUPER_ADMIN" || (session.role === "AGENT" && customer.agent.toString() === session.userId)) return { session, customer }
  if (session.role === "DEVELOPMENT_OFFICER") { const agent = await User.findOne({ _id: customer.agent, manager: session.userId }); return { session, customer: agent ? customer : null } }
  const branch = await Branch.findById(customer.branch)
  const allowed = (session.role === "BRANCH_MANAGER" && branch?.code === session.branch) || (session.role === "REGIONAL_ADMIN" && branch?.region === session.region)
  return { session, customer: allowed ? customer : null }
}
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, customer } = await findAccessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); if (!customer) return NextResponse.json({ success: false, error: "Customer not found or forbidden." }, { status: 404 })
  return NextResponse.json({ success: true, data: await customer.populate(["agent", "branch"]), policies: [] })
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, customer } = await findAccessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); if (!customer) return NextResponse.json({ success: false, error: "Customer not found or forbidden." }, { status: 404 })
  const body = await request.json(); if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) { customer.isActive = body.isActive; await customer.save(); return NextResponse.json({ success: true, data: customer }) }
  const parsed = customerSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 })
  const duplicate = await Customer.findOne({ _id: { $ne: customer._id }, branch: customer.branch, $or: [{ panNumber: parsed.data.panNumber || "__none__" }, { aadhaarNumber: parsed.data.aadhaarNumber || "__none__" }] })
  if (duplicate) return NextResponse.json({ success: false, error: "A customer with this PAN or Aadhaar already exists in this branch." }, { status: 409 })
  Object.assign(customer, { ...parsed.data, panNumber: parsed.data.panNumber?.toUpperCase() }); await customer.save(); return NextResponse.json({ success: true, data: customer })
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB(); const { id } = await params; const { session, customer } = await findAccessible(id)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); if (!customer) return NextResponse.json({ success: false, error: "Customer not found or forbidden." }, { status: 404 })
  customer.isActive = false; await customer.save(); return NextResponse.json({ success: true, data: { id } })
}
