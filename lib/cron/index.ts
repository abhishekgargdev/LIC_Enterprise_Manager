import cron from "node-cron"
import { connectDB } from "@/lib/db"
import { runDailyPremiumStatus } from "@/lib/cron/daily-premium-status"
import { runDailyExpiryCheck } from "@/lib/cron/daily-expiry-check"
import { runDailyNotifications } from "@/lib/cron/daily-notifications"

let started = false
export function startLocalDailyCron() {
  if (started || process.env.NODE_ENV === "production") return
  started = true
  cron.schedule("0 0 * * *", async () => {
    await connectDB()
    await runDailyPremiumStatus()
    await runDailyExpiryCheck()
    await runDailyNotifications()
  })
}
