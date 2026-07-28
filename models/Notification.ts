import mongoose from "mongoose"
const notificationSchema = new mongoose.Schema({ recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, type: { type: String, required: true }, title: String, message: String, entityType: String, entityId: String, readAt: Date, dedupeKey: { type: String, unique: true } }, { timestamps: true })
export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
