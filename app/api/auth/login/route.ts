import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { SignJWT } from "jose"
import { compare, hash } from "bcryptjs"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")
const JWT_EXPIRATION = "7d"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email }).select("+passwordHash")
    if (!user) {
      return Response.json({
        success: false,
        error: "Invalid credentials",
      }, { status: 401 })
    }

    const isValid = await compare(password, user.passwordHash)
    if (!isValid) {
      return Response.json({
        success: false,
        error: "Invalid credentials",
      }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({
        success: false,
        error: "Account is inactive",
      }, { status: 403 })
    }

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

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() })

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
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return Response.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 })
  }
}
