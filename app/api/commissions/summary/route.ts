import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Commission } from "@/models/Commission"
export async function GET() { await connectDB(); const session = await getSession(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); const match = session.role === "AGENT" ? { agent: session.userId } : session.role === "DEVELOPMENT_OFFICER" ? { manager: session.userId } : {}; const data = await Commission.aggregate([{ $match: match }, { $group: { _id: null, agentTotal: { $sum: "$agentAmount" }, managerTotal: { $sum: "$managerAmount" }, branchTotal: { $sum: "$branchAmount" }, total: { $sum: { $add: ["$agentAmount", "$managerAmount", "$branchAmount"] } } } }]); return NextResponse.json({ success: true, data: data[0] || { agentTotal: 0, managerTotal: 0, branchTotal: 0, total: 0 } }) }
