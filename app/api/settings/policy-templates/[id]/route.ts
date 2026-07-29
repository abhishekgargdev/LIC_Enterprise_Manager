import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { PolicyTemplate } from "@/models/PolicyTemplate"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) {
      return Response.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 })
    }

    const { id } = await params
    const { name, planName, defaultTerm, defaultSumAssured, defaultCommissionPercent } = await request.json()

    await connectDB()

    const template = await PolicyTemplate.findById(id)
    if (!template) {
      return Response.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    if (name) template.name = name
    if (planName) template.planName = planName
    if (defaultTerm !== undefined) template.defaultTerm = Number(defaultTerm)
    if (defaultSumAssured !== undefined) template.defaultSumAssured = Number(defaultSumAssured)
    if (defaultCommissionPercent !== undefined) template.defaultCommissionPercent = Number(defaultCommissionPercent)

    await template.save()

    return Response.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    console.error("Update policy template error:", error)
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "REGIONAL_ADMIN"].includes(session.role)) {
      return Response.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 })
    }

    const { id } = await params

    await connectDB()

    const template = await PolicyTemplate.findByIdAndDelete(id)
    if (!template) {
      return Response.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: { message: "Template deleted successfully" },
    })
  } catch (error: any) {
    console.error("Delete policy template error:", error)
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
