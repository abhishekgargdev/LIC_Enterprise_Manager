import mongoose from "mongoose"

const auditLogSchema = new mongoose.Schema(
  {
    // New fields
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },

    // Backward compatibility fields
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetType: String,
    targetId: String,
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

// Add index on user, action, entityType, and createdAt to speed up audits list
auditLogSchema.index({ user: 1 })
auditLogSchema.index({ action: 1 })
auditLogSchema.index({ entityType: 1 })
auditLogSchema.index({ createdAt: -1 })

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema)
