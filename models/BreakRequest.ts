import mongoose from "mongoose";

const BreakRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  startedAt: { type: Date },
  expiresAt: { type: Date },
  notifiedEnd: { type: Boolean, default: false }
});

export default mongoose.models.BreakRequest || mongoose.model("BreakRequest", BreakRequestSchema);
