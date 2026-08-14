import { NextResponse } from "next/server";
import connectDB from "@/utils/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";
export const dynamic = 'force-dynamic';

type SessionUserWithId = {
  id?: string | null;
};

export async function PATCH(request: Request, { params }: { params: { id?: string } }) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions) as { user?: SessionUserWithId } | null;
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const url = new URL(request.url);
    const notificationId = url.searchParams.get("id");
    

    

    const updated = await Notification.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Notification marked as read", notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
