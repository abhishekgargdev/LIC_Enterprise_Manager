import mongoose from "mongoose"
import type { UserRole } from "@/lib/permissions"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "REGIONAL_ADMIN", "BRANCH_MANAGER", "DEVELOPMENT_OFFICER", "AGENT"],
      required: true,
    },
    employeeCode: String,
    agentCode: String,
    phone: String,
    avatarUrl: String,
    region: {
      type: String,
      nullable: true,
    },
    branch: {
      type: String,
      nullable: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      nullable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    joiningDate: Date,
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model("User", userSchema)
