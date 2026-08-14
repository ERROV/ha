import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";
export const dynamic = 'force-dynamic';

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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { title, body } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    const newNotification = new Notification({
      title,
      body,
      userId,
      createdAt: new Date(),
    });

    await newNotification.save();

    return NextResponse.json({ message: "Notification saved successfully" });
  } catch (error) {
    console.error("Error saving notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
