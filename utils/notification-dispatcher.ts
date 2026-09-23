import Notification from "@/models/Notification";
import User from "@/models/User";
import { broadcastToUser, broadcastToAll } from "@/app/api/notifications/stream/notifier";
import webpush from "web-push";

// Configure web-push safely
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            process.env.VAPID_EMAIL || 'mailto:admin@halaftth.site',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
    } catch (e) {
        console.warn("Failed to set VAPID details for web-push:", e);
    }
}

interface NotifyOptions {
    userId?: string;
    broadcastToAll?: boolean;
    title: string;
    body: string;
    type?: string;
    data?: any;
    createdBy?: string;
}

export async function dispatchMultiChannelNotification(options: NotifyOptions) {
    const { userId, broadcastToAll: isBroadcast, title, body, type, data, createdBy } = options;

    const results = {
        sse: false,
        webpush: false,
        whatsapp: false,
        db: false
    };

    try {
        const targetUserIds: string[] = [];

        if (isBroadcast) {
            const allUsers = await User.find({}, { _id: 1 });
            targetUserIds.push(...allUsers.map(u => u._id.toString()));
            broadcastToAll({ title, body, createdAt: new Date(), type, data });
            results.sse = true;
        } else if (userId) {
            targetUserIds.push(userId);
            broadcastToUser(userId, { title, body, createdAt: new Date(), type, data });
            results.sse = true;
        }

        for (const tid of targetUserIds) {
            const user = await User.findById(tid);
            if (!user) continue;

            // 1. Web Push
            if (user.pushSubscription) {
                try {
                    await webpush.sendNotification(
                        user.pushSubscription,
                        JSON.stringify({ title, body, icon: '/favicon.ico' })
                    );
                    results.webpush = true;
                } catch (err: any) {
                    if (err.statusCode === 410) {
                        await User.findByIdAndUpdate(tid, { pushSubscription: null });
                    }
                }
            }

            // 2. WhatsApp (via Bot Server)
            /* if (user.phoneNumber) {
                try {
                    const botServerUrl = `http://localhost:${process.env.SOCKET_IO_PORT || 3001}`;
                    // The Bot Server index.js listens on SOCKET_IO_PORT for the http server usually, 
                    // but check the listen port. It's SOCKET_PORT (3001) in index.js.

                    await fetch(`${botServerUrl}/api/notify/custom`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            phoneNumber: user.phoneNumber,
                            userId: tid,
                            message: `*${title}*\n\n${body}`,
                            userName: user.name
                        })
                    });
                    results.whatsapp = true;
                } catch (err) {
                    console.error(`WhatsApp failed for ${user.name}:`, err);
                }
            } */

            // 3. Save to Database
            const notification = new Notification({
                userId: tid,
                title,
                body,
                read: false,
                createdAt: new Date(),
                createdBy: createdBy || 'system',
                data: { ...data, type }
            });
            await notification.save();
            results.db = true;
        }

        return { success: true, results };
    } catch (error) {
        console.error("❌ Dispatch Error:", error);
        return { success: false, error };
    }
}
