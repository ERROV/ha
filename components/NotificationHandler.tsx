"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { mutate } from "swr";

export default function NotificationHandler() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;

        console.log("🔌 Establishing SSE connection for notifications...");

        const eventSource = new EventSource("/api/notifications/stream");

        eventSource.onopen = () => {
            console.log("✅ SSE connection established");
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "connected") {
                    console.log("SSE stream connected");
                    return;
                }

                if (data.type === "notification") {
                    console.log(" New notification received:", data.data);

                    // Trigger SWR revalidation to update notification list
                    mutate("/api/notifications");

                    // Show browser notification if permission granted
                    if (Notification.permission === "granted") {
                        new Notification(data.data.title, {
                            body: data.data.body,
                            icon: "/favicon.ico",
                            badge: "/favicon.ico",
                        });
                    }
                }
            } catch (error) {
                console.error("Error parsing SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("❌ SSE connection error:", error);
            eventSource.close();

            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                console.log("🔄 Attempting to reconnect SSE...");
                // The effect will re-run and create a new connection
            }, 5000);
        };

        // Cleanup on unmount
        return () => {
            console.log("🔌 Closing SSE connection");
            eventSource.close();
        };
    }, [session, status]);

    return null;
}
