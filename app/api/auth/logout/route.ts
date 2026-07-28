import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session")

    return Response.json({
      success: true,
      data: { message: "Logged out successfully" },
    })
  } catch (error) {
    console.error("Logout error:", error)
    return Response.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 })
  }
}
