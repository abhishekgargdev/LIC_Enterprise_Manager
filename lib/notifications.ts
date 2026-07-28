import { Notification } from "@/models/Notification"
import mongoose from "mongoose"

export async function notify(
  userId: string,
  type: string,
  payload: {
    title: string
    message: string
    link?: string
    relatedId?: string
    dedupeKey?: string
  }
) {
  const data = {
    recipient: new mongoose.Types.ObjectId(userId),
    type,
    title: payload.title,
    message: payload.message,
    link: payload.link || "",
    isRead: false,
    relatedId: payload.relatedId ? new mongoose.Types.ObjectId(payload.relatedId) : null,
    // Backward compatibility fields
    entityType: type,
    entityId: payload.relatedId || "",
  }

  if (payload.dedupeKey) {
    await Notification.updateOne(
      { dedupeKey: payload.dedupeKey },
      {
        $setOnInsert: {
          ...data,
          dedupeKey: payload.dedupeKey,
        },
      },
      { upsert: true }
    )
  } else {
    await Notification.create(data)
  }
}
