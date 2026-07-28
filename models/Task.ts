import mongoose from "mongoose"

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
  status: { type: String, enum: ["PENDING", "IN_PROGRESS", "DONE"], default: "PENDING" },
  completedAt: { type: Date, default: null },
}, { timestamps: true })
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 })
taskSchema.index({ assignedBy: 1, createdAt: -1 })
export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema)
