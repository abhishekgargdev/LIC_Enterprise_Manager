import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({
        success: false,
        error: "Unauthorized",
      }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.userId).select("-passwordHash")
    if (!user) {
      return Response.json({
        success: false,
        error: "User not found",
      }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          branch: user.branch,
          region: user.region,
        },
      },
    })
  } catch (error) {
    console.error("Get me error:", error)
    return Response.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 })
  }
}
