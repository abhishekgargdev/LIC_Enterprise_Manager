import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { compare, hash } from "bcryptjs"
import { SignJWT } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")
const JWT_EXPIRATION = "7d"

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { name, phone, avatarUrl, oldPassword, newPassword } = await request.json()

    await connectDB()

    const user = await User.findById(session.userId).select("+passwordHash")
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Update basic info
    if (name && name.trim()) {
      user.name = name.trim()
    }
    if (phone !== undefined) {
      user.phone = phone.trim()
    }
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl.trim()
    }

    // Password change
    if (newPassword && newPassword.trim()) {
      if (!oldPassword) {
        return Response.json({ success: false, error: "Old password is required to set a new password." }, { status: 400 })
      }
      if (newPassword.trim().length < 6) {
        return Response.json({ success: false, error: "New password must be at least 6 characters." }, { status: 400 })
      }

      const isValid = await compare(oldPassword, user.passwordHash)
      if (!isValid) {
        return Response.json({ success: false, error: "Incorrect old password." }, { status: 400 })
      }

      user.passwordHash = await hash(newPassword.trim(), 12)
    }

    await user.save()

    // Regenerate session cookie so layout sidebar has fresh name/email
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branch,
      region: user.region,
      manager: user.manager?.toString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET)

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
        },
      },
    })
  } catch (error: any) {
    console.error("Profile update error:", error)
    return Response.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
