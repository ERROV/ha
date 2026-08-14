import { authOptions } from "@/app/api/auth/authOptions";
import { getServerSession } from "next-auth";

interface NotificationPayload {
  title: string;
  body: string;
  userIds: string[];
}

export async function sendNotification(title: string, body: string, userIds: string[]) {
  const session = await getServerSession(authOptions);
  console.log("Sending notification:", { title, body, userIds });

  try {
    const baseUrl =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        : "";

    const res = await fetch(`${baseUrl}/api/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, userIds }), // إرسال المصفوفة
    });

    const data = await res.json();

    const userId = (session?.user as { id?: string })?.id;

    await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId }),
    });

    if (!res.ok) {
      console.error("❌ Notification failed:", data.error);
      return { success: false, error: data.error };
    }

    console.log("✅ Notification sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error calling notification API:", error);
    return { success: false, error };
  }
}
