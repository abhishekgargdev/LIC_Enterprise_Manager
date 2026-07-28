import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { CommissionRule } from "@/models/CommissionRule"
import { logAction } from "@/lib/audit"
export async function GET() { await connectDB(); const session = await getSession(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); return NextResponse.json({ success: true, data: await CommissionRule.find().sort({ effectiveFrom: -1 }).lean() }) }
export async function POST(request: Request) { await connectDB(); const session = await getSession(); if (!session || !["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }); const body = await request.json(); const total = Number(body.agentPercent) + Number(body.managerPercent) + Number(body.branchPercent); if (total > 100) return NextResponse.json({ success: false, error: "Commission shares cannot exceed 100% of premium." }, { status: 400 }); const rule = await CommissionRule.create(body); await logAction(session, "CREATED_COMMISSION_RULE", "CommissionRule", rule._id.toString(), null, rule.toObject(), request); return NextResponse.json({ success: true, data: rule }) }
