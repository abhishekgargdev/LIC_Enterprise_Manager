import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { runDailyPremiumStatus } from "@/lib/cron/daily-premium-status"
import { runDailyExpiryCheck } from "@/lib/cron/daily-expiry-check"
import { runDailyNotifications } from "@/lib/cron/daily-notifications"

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") || request.headers.get("x-cron-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()
  const [premiums, expiry, notifications] = await Promise.all([
    runDailyPremiumStatus(),
    runDailyExpiryCheck(),
    runDailyNotifications(),
  ])

  return NextResponse.json({ success: true, data: { premiums, expiry, notifications } })
}
