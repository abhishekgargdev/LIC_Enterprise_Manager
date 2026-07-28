import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Commission } from "@/models/Commission"
import { Branch } from "@/models/Branch"
export async function GET(request: Request) { await connectDB(); const session = await getSession(); if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); const p = new URL(request.url).searchParams; const filter: Record<string, unknown> = {}; if (session.role === "AGENT") filter.agent = session.userId; else if (session.role === "DEVELOPMENT_OFFICER") filter.manager = session.userId; else if (session.role === "BRANCH_MANAGER") filter.branch = (await Branch.findOne({ code: session.branch }))?._id; if (p.get("agent")) filter.agent = p.get("agent"); if (p.get("year")) { const y = Number(p.get("year")); filter.calculatedAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) } } const data = await Commission.find(filter).populate("policy", "policyNumber").populate("agent", "name").populate("manager", "name").sort({ calculatedAt: -1 }).lean(); return NextResponse.json({ success: true, data }) }
