import mongoose from "mongoose"
const premiumSchema = new mongoose.Schema({ policy: { type: mongoose.Schema.Types.ObjectId, ref: "Policy", required: true }, dueDate: { type: Date, required: true }, amount: { type: Number, required: true }, paidDate: Date, paidMode: { type: String, enum: ["CASH", "CHEQUE", "ONLINE", "UPI"] }, receiptNumber: String, lateFee: { type: Number, default: 0 }, status: { type: String, enum: ["PAID", "DUE", "OVERDUE", "MISSED"], default: "DUE" }, recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }, { timestamps: true })
premiumSchema.index({ policy: 1, dueDate: 1 }, { unique: true })
export const Premium = mongoose.models.Premium || mongoose.model("Premium", premiumSchema)
