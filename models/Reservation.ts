import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  timeSlot: {
    type: String,
    required: true,
  },
  shift: {
    type: String,
    enum: ["morning", "evening"],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
