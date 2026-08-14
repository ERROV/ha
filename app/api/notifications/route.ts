import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";
import { broadcastToUser } from "./stream/notifier";
export const dynamic = 'force-dynamic';

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function GET(request: Request) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions) as { user: CustomSessionUser };
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions) as { user: CustomSessionUser };
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, body, data } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    const newNotification = new Notification({
      title,
      body,
      userId: session.user.id,
      data,
      read: false,
      createdAt: new Date(),
    });

    await newNotification.save();

    // Broadcast to SSE connections
    try {
      broadcastToUser(session.user.id, {
        id: newNotification._id,
        title,
        body,
        data,
        read: false,
        createdAt: newNotification.createdAt,
      });
    } catch (broadcastError) {
      console.error("Error broadcasting notification:", broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      message: "Notification saved successfully",
      notification: newNotification
    });
  } catch (error) {
    console.error("Error saving notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}