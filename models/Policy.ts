import mongoose from "mongoose"
export const policyStatuses = ["ACTIVE", "PENDING", "LAPSED", "EXPIRED", "MATURED", "CANCELLED", "CLAIM_SETTLED"] as const
const policySchema = new mongoose.Schema({ policyNumber: { type: String, unique: true, required: true }, customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true }, agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true }, planName: { type: String, required: true }, policyTerm: { type: Number, required: true }, premiumAmount: { type: Number, required: true }, premiumMode: { type: String, enum: ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "SINGLE"], required: true }, sumAssured: { type: Number, required: true }, startDate: { type: Date, required: true }, maturityDate: { type: Date, required: true }, status: { type: String, enum: policyStatuses, default: "PENDING" }, lastPremiumPaidDate: Date }, { timestamps: true })

policySchema.index({ agent: 1 })
policySchema.index({ manager: 1 })
policySchema.index({ branch: 1 })
policySchema.index({ status: 1 })

export const Policy = mongoose.models.Policy || mongoose.model("Policy", policySchema)
