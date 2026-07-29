import mongoose from "mongoose"

const policyTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    planName: {
      type: String,
      required: true,
    },
    defaultTerm: {
      type: Number,
      required: true,
    },
    defaultSumAssured: {
      type: Number,
      required: true,
    },
    defaultCommissionPercent: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

export const PolicyTemplate =
  mongoose.models.PolicyTemplate || mongoose.model("PolicyTemplate", policyTemplateSchema)
