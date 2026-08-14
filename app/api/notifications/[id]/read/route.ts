import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/authOptions";
export const dynamic = 'force-dynamic';

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function PATCH(
  
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions) as { user: CustomSessionUser };
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}