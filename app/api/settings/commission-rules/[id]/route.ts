import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { CommissionRule } from "@/models/CommissionRule"
import { logAction } from "@/lib/audit"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session || !["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const rule = await CommissionRule.findById(id)
    if (!rule) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 })
    }

    const oldVal = rule.toObject()
    if (body.isActive !== undefined) rule.isActive = body.isActive
    if (body.agentPercent !== undefined) rule.agentPercent = Number(body.agentPercent)
    if (body.managerPercent !== undefined) rule.managerPercent = Number(body.managerPercent)
    if (body.branchPercent !== undefined) rule.branchPercent = Number(body.branchPercent)

    const total = rule.agentPercent + rule.managerPercent + rule.branchPercent
    if (total > 100) {
      return NextResponse.json({ success: false, error: "Commission shares cannot exceed 100%." }, { status: 400 })
    }

    await rule.save()
    await logAction(session, "UPDATED_COMMISSION_RULE", "CommissionRule", rule._id.toString(), oldVal, rule.toObject(), request)

    return NextResponse.json({ success: true, data: rule })
  } catch (error: any) {
    console.error("Update commission rule error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const session = await getSession()
    if (!session || !["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const rule = await CommissionRule.findByIdAndDelete(id)
    if (!rule) {
      return NextResponse.json({ success: false, error: "Rule not found" }, { status: 404 })
    }

    await logAction(session, "DELETED_COMMISSION_RULE", "CommissionRule", id, rule.toObject(), null, request)

    return NextResponse.json({ success: true, data: { message: "Rule deleted successfully" } })
  } catch (error: any) {
    console.error("Delete commission rule error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
