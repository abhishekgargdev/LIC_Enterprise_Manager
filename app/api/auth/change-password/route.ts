import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { compare, hash } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({
        success: false,
        error: "Unauthorized",
      }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return Response.json({
        success: false,
        error: "Invalid password: must be at least 6 characters",
      }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.userId).select("+passwordHash")
    if (!user) {
      return Response.json({
        success: false,
        error: "User not found",
      }, { status: 404 })
    }

    const isValid = await compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return Response.json({
        success: false,
        error: "Current password is incorrect",
      }, { status: 401 })
    }

    const newHash = await hash(newPassword, 10)
    await User.findByIdAndUpdate(session.userId, { passwordHash: newHash })

    return Response.json({
      success: true,
      data: { message: "Password changed successfully" },
    })
  } catch (error) {
    console.error("Change password error:", error)
    return Response.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 })
  }
}
