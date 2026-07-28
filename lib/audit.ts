import { AuditLog } from "@/models/AuditLog"

export async function logAction(
  session: { userId: string } | null,
  action: string,
  entityType: string,
  entityId: string,
  oldValue: any | null,
  newValue: any | null,
  req?: Request
) {
  if (!session) return

  let ipAddress = ""
  let userAgent = ""

  if (req) {
    ipAddress =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      ""
    userAgent = req.headers.get("user-agent") || ""
  }

  await AuditLog.create({
    user: session.userId,
    actor: session.userId, // Backward compatibility
    action,
    entityType,
    targetType: entityType, // Backward compatibility
    entityId: String(entityId),
    targetId: String(entityId), // Backward compatibility
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    details: {
      oldValue,
      newValue,
    }, // Backward compatibility
  })
}
