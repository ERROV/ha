import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { broadcastToUser, broadcastToAll } from "../../stream/notifier";
import User from "@/models/User";
import webpush from "web-push";

export const dynamic = "force-dynamic";

// Configure web-push once
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@halaftth.site',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

interface CustomSessionUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function POST(request: Request) {
    await connectDB();

    try {
        const session = await getServerSession(authOptions) as { user: CustomSessionUser };

        // Check if user is admin
        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
        }

        const { title, body, userId, broadcastToAllUsers } = await request.json();

        if (!title || !body) {
            return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
        }

        // If broadcasting to all users
        if (broadcastToAllUsers) {
            // Get all users
            const users = await User.find({});

            // Process notifications
            for (const user of users) {
                const notification = new Notification({
                    title,
                    body,
                    userId: user._id.toString(),
                    createdBy: session.user.id,
                    read: false,
                    createdAt: new Date(),
                });
                await notification.save();

                // Send Web Push if subscription exists
                if (user.pushSubscription) {
                    try {
                        webpush.sendNotification(
                            user.pushSubscription,
                            JSON.stringify({ title, body, icon: '/favicon.ico' })
                        ).catch(err => {
                            if (err.statusCode === 410) {
                                User.findByIdAndUpdate(user._id, { pushSubscription: null }).exec();
                            }
                        });
                    } catch (e) { }
                }
            }

            // Broadcast to all SSE connections
            broadcastToAll({
                id: "broadcast-" + Date.now(),
                title,
                body,
                read: false,
                createdAt: new Date(),
            });

            return NextResponse.json({
                message: `Broadcast sent to ${users.length} users`,
                count: users.length,
            });
        }

        // If sending to specific user
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const newNotification = new Notification({
            title,
            body,
            userId,
            createdBy: session.user.id,
            read: false,
            createdAt: new Date(),
        });

        await newNotification.save();

        // Send Web Push
        const targetUser = await User.findById(userId);
        if (targetUser?.pushSubscription) {
            try {
                await webpush.sendNotification(
                    targetUser.pushSubscription,
                    JSON.stringify({ title, body, icon: '/favicon.ico' })
                );
            } catch (err: any) {
                if (err.statusCode === 410) {
                    await User.findByIdAndUpdate(userId, { pushSubscription: null });
                }
            }
        }

        // Broadcast to SSE
        try {
            broadcastToUser(userId, {
                id: newNotification._id,
                title,
                body,
                read: false,
                createdAt: newNotification.createdAt,
            });
        } catch (broadcastError) {
            console.error("Error broadcasting notification:", broadcastError);
        }

        return NextResponse.json({
            message: "Notification sent successfully",
            notification: newNotification,
        });
    } catch (error) {
        console.error("Error sending broadcast notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
