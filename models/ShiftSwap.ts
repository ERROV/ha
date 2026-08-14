import mongoose from "mongoose";

const ShiftSwapSchema = new mongoose.Schema({
  offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  offeredShiftType: { type: String, enum: ["morning", "evening", "night", "over"], required: true },
  takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  takenShiftType: { type: String, enum: ["morning", "evening", "night", "over"], required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ShiftSwap || mongoose.model("ShiftSwap", ShiftSwapSchema);
