import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { PolicyTemplate } from "@/models/PolicyTemplate"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const templates = await PolicyTemplate.find().sort({ name: 1 })

    return Response.json({
      success: true,
      data: templates,
    })
  } catch (error: any) {
    console.error("Get policy templates error:", error)
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Auth gate: SUPER_ADMIN and REGIONAL_ADMIN only
    if (!["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) {
      return Response.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 })
    }

    const { name, planName, defaultTerm, defaultSumAssured, defaultCommissionPercent } = await request.json()

    if (!name || !planName || !defaultTerm || !defaultSumAssured || defaultCommissionPercent === undefined) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const existing = await PolicyTemplate.findOne({ name })
    if (existing) {
      return Response.json({ success: false, error: "A template with this name already exists." }, { status: 400 })
    }

    const template = await PolicyTemplate.create({
      name,
      planName,
      defaultTerm: Number(defaultTerm),
      defaultSumAssured: Number(defaultSumAssured),
      defaultCommissionPercent: Number(defaultCommissionPercent),
    })

    return Response.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    console.error("Create policy template error:", error)
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
