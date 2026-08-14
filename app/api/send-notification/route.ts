import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);
    const senderId = (session?.user as { id?: string })?.id || 'system';

    const { title, body, userIds } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetUserIds = Array.isArray(userIds) ? userIds : [];

    if (targetUserIds.length > 0) {
      for (const userId of targetUserIds) {
        await dispatchMultiChannelNotification({
          userId,
          title,
          body,
          createdBy: senderId,
          type: 'custom'
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
