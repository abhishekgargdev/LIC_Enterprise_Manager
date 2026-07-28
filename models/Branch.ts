import mongoose from "mongoose"

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    branchManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export const Branch = mongoose.models.Branch || mongoose.model("Branch", branchSchema)
