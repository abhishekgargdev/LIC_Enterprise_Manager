import mongoose from "mongoose"

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, dob: { type: Date, required: true },
  gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true }, mobile: { type: String, required: true }, email: String,
  address: { line1: { type: String, required: true }, line2: String, city: { type: String, required: true }, state: { type: String, required: true }, pincode: { type: String, required: true } },
  aadhaarNumber: String, panNumber: String, occupation: String, annualIncome: Number,
  nominee: { name: String, relation: String, dob: Date },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  isActive: { type: Boolean, default: true }, notes: String,
}, { timestamps: true })

customerSchema.index({ branch: 1, panNumber: 1 }, { unique: true, partialFilterExpression: { panNumber: { $type: "string", $ne: "" } } })
customerSchema.index({ branch: 1, aadhaarNumber: 1 }, { unique: true, partialFilterExpression: { aadhaarNumber: { $type: "string", $ne: "" } } })
export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema)
