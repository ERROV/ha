import mongoose from "mongoose";

const FcmTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
});

export default mongoose.models.FcmToken || mongoose.model("FcmToken", FcmTokenSchema);
