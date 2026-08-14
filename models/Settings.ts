import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true,
    default: "LUNCH_CONFIG",
  },
  singleEmployeeTimes: {
    type: [String],
    default: ["12:00", "12:30", "1:00", "1:30", "2:00", "2:30"],
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
