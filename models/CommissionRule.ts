import mongoose from "mongoose"
const schema = new mongoose.Schema({ appliesTo: { type: String, enum: ["GLOBAL", "BRANCH", "PLAN"], required: true }, branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, planName: String, agentPercent: { type: Number, required: true }, managerPercent: { type: Number, required: true }, branchPercent: { type: Number, required: true }, effectiveFrom: { type: Date, required: true }, isActive: { type: Boolean, default: true } }, { timestamps: true })
export const CommissionRule = mongoose.models.CommissionRule || mongoose.model("CommissionRule", schema)
