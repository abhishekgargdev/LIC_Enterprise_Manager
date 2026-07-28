import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "PREMIUM_DUE",
        "POLICY_EXPIRING",
        "POLICY_LAPSED",
        "BIRTHDAY",
        "CLAIM_STATUS_CHANGE",
        "NEW_ASSIGNMENT",
        "COMMISSION_CREDITED",
        "LEAD_FOLLOWUP_DUE",
        "PREMIUM_MISSED",
        "POLICY_MATURED",
        "CLAIM_SETTLED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    dedupeKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Backward compatibility fields
    entityType: String,
    entityId: String,
    readAt: Date,
  },
  { timestamps: true }
)

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
