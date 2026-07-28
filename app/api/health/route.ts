import { connectDB } from "@/lib/db"

export async function GET() {
  await connectDB()

  return new Response(
    JSON.stringify({
      success: true,
      data: { message: "Healthy", timestamp: new Date().toISOString() },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}
