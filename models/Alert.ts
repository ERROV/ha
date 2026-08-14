import mongoose, { Schema, model, models } from "mongoose";

const AlertSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// models.Alert ? reuse the existing model (important for hot reload in dev)
const Alert = models.Alert || model("Alert", AlertSchema);

export default Alert;
