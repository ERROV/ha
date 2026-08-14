import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;

  pushSubscription?: any | null;
  phoneNumber?: string | null;
  workHours?: "morning" | "evening" | null;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    pushSubscription: { type: Object, default: null },
    phoneNumber: { type: String, default: null },
    workHours: { type: String, enum: ["morning", "evening"], default: null }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
