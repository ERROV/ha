import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
});

export default models.Notification || model("Notification", NotificationSchema);