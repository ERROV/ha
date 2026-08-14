import mongoose from "mongoose";

const ShiftOfferSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["morning", "evening", "night", "over"], required: true },
  date: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ShiftOffer || mongoose.model("ShiftOffer", ShiftOfferSchema);
