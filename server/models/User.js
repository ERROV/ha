const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        name: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        pushSubscription: { type: Object, default: null }, // { endpoint, keys: { p256dh, auth } }
        phoneNumber: { type: String, default: null },
        workHours: { type: String, enum: ["morning", "evening"], default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
