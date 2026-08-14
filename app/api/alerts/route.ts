import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import NotificationModel from "@/models/Notification";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";

export const dynamic = 'force-dynamic';

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as CustomSessionUser | undefined;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connect();

    const alerts = await NotificationModel.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Fetch alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connect();

    const { title, body, createdBy } = await request.json();

    if (!title || !body || !createdBy) {
      return NextResponse.json({ error: "Missing title, body or createdBy" }, { status: 400 });
    }

    const session = await getServerSession(authOptions) as { user: CustomSessionUser };
    const senderId = session?.user?.id || createdBy;

    //  Dispatch Multi-Channel Notification to Everyone
    await dispatchMultiChannelNotification({
      broadcastToAll: true,
      title,
      body,
      createdBy: senderId,
      type: 'admin_alert'
    });

    return NextResponse.json({ message: "Alert sent and saved for all users" }, { status: 201 });
  } catch (error) {
    console.error("Failed to send alert:", error);
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
    }

    const deleted = await NotificationModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Alert deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
