// models/BreakRequest.js
const mongoose = require("mongoose");

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

// Prevent model overwrite upon hot reloads
module.exports = mongoose.models?.BreakRequest || mongoose.model("BreakRequest", BreakRequestSchema);
