const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
});

module.exports = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
