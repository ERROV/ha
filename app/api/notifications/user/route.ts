import { NextResponse } from "next/server";
import connect from "@/utils/db";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";
export const dynamic = 'force-dynamic';

/* export async function GET() {
  await connect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session?.user as { id?: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId((session?.user as { id?: string })?.id);

    const notifications = await Notification.find({
      $or: [
        { userId: userId }, 
        { userId: null }   
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} */

export async function POST(request: Request) {
  await connect();

  try {
    const { title, body, userId } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    // 🔔 Dispatch Multi-Channel Notification
    await dispatchMultiChannelNotification({
      userId: userId || undefined,
      broadcastToAll: !userId,
      title,
      body,
      createdBy: "admins",
      type: 'user_notification'
    });

    return NextResponse.json({
      message: "Notification sent successfully"
    });
  } catch (error) {
    console.error("Error sending user notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
