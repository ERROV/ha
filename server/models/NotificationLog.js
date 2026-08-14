const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
    {
        userName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, enum: ["reminder", "custom"], default: "reminder" },
        whatsappStatus: { type: String, enum: ["sent", "failed", "n/a"], default: "n/a" },
        webpushStatus: { type: String, enum: ["sent", "failed", "n/a"], default: "n/a" },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.models.NotificationLog || mongoose.model("NotificationLog", notificationLogSchema);
