import mongoose from "mongoose"
const policyHistorySchema = new mongoose.Schema({ policy: { type: mongoose.Schema.Types.ObjectId, ref: "Policy", required: true }, field: { type: String, required: true }, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, changedAt: { type: Date, default: Date.now } }, { timestamps: false })
export const PolicyHistory = mongoose.models.PolicyHistory || mongoose.model("PolicyHistory", policyHistorySchema)
