"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { Bell, BellOff, BellRing, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationManager = () => {
    const { data: session, status } = useSession();
    const eventSourceRef = useRef<EventSource | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // 1. Initial State Sync
    useEffect(() => {
        if (typeof window !== "undefined") {
            setPermission(Notification.permission);
            setIsVisible(true);
        }
    }, []);

    // 2. SSE Connection Management
    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;

        console.log("🔌 Initializing SSE connection...");
        const eventSource = new EventSource("/api/notifications/stream");
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "notification") {
                    console.log(" SSE Notification:", data.data);
                    mutate("/api/notifications");
                    toast.success(data.data.body, {
                        duration: 5000,
                        position: "top-right",
                        icon: "",
                    });

                    if (Notification.permission === "granted" && document.visibilityState !== "visible") {
                        new Notification(data.data.title, {
                            body: data.data.body,
                            icon: "/favicon.ico",
                        });
                    }
                }
            } catch (error) {
                console.error("Error parsing SSE message:", error);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [session, status]);

    // 3. Automated Web Push Registration (Silent check)
    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;
        if (Notification.permission === "granted") {
            registerPush(true);
        }
    }, [session, status]);

    const registerPush = async (silent = false) => {
        try {
            if (!("serviceWorker" in navigator)) {
                if (!silent) toast.error("متصفحك لا يدعم الإشعارات");
                return;
            }

            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== "granted") {
                if (!silent) toast.error("يجب السماح بالإشعارات من إعدادات المتصفح");
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicKey) return;

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                });
            }

            await fetch("/api/notifications/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription }),
            });

            setIsSubscribed(true);
            if (!silent) toast.success("تم تفعيل الإشعارات بنجاح! ");
        } catch (error) {
            console.error("❌ Failed to register Web Push:", error);
            if (!silent) toast.error("حدث خطأ أثناء تفعيل الإشعارات");
        }
    };

    if (status !== "authenticated") return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-[9999]"
                >
                    <button
                        onClick={() => registerPush()}
                        className={`
                            relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 group
                            ${permission === "granted" ? "bg-green-500 hover:bg-green-600" :
                                permission === "denied" ? "bg-red-500 hover:bg-red-600" :
                                    "bg-blue-600 hover:bg-blue-700 animate-pulse"}
                        `}
                    >
                        {permission === "granted" ? (
                            <div className="relative">
                                <Bell className="w-6 h-6 text-white" />
                                <CheckCircle2 className="w-4 h-4 text-white absolute -top-2 -right-2 bg-green-500 rounded-full border border-white" />
                            </div>
                        ) : permission === "denied" ? (
                            <BellOff className="w-6 h-6 text-white" />
                        ) : (
                            <BellRing className="w-6 h-6 text-white" />
                        )}

                        {/* Tooltip */}
                        <div className="absolute right-16 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                            {permission === "granted" ? "الإشعارات مفعلة ✅" :
                                permission === "denied" ? "الإشعارات محظورة! ❌" :
                                    "فعل الإشعارات من هنا "}
                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-8 border-transparent border-l-slate-900" />
                        </div>

                        {permission === "default" && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
                            </span>
                        )}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default NotificationManager;
