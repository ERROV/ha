import { NextResponse } from "next/server";
import connect from "@/utils/db";
import BreakRequest from "@/models/BreakRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import User from "@/models/User";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";

export const dynamic = 'force-dynamic';

function isSameDay(date1: Date, date2: Date) {
  return date1.toDateString() === date2.toDateString();
}
interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await connect();

  const user = session?.user as CustomSessionUser | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const userId = user.id;
  const userName = user.name || user.email || "Unknown";

  const today = new Date();

  // Get all approved breaks that expired and were requested today
  const completedToday = await BreakRequest.find({
    userId,
    status: "approved",
    expiresAt: { $lte: new Date() },
  });

  const usedToday = completedToday.filter((b) =>
    isSameDay(new Date(b.requestedAt), today)
  ).length;

  if (usedToday >= 3) {
    return new NextResponse("You have reached the daily break limit (3).", {
      status: 400,
    });
  }

  const hasPending = await BreakRequest.findOne({ userId, status: "pending" });
  if (hasPending)
    return new NextResponse("You already have a pending break request", {
      status: 400,
    });

  const newRequest = new BreakRequest({
    userId,
    userName,
    status: "pending",
    requestedAt: new Date(),
  });

  await newRequest.save();

  //  Dispatch Notifications to Admins
   try {
    const adminUsers = await User.find({ role: "admin" });
    const title = "طلب بريك جديد";
    const body = `الموظف ${userName} طلب بريك الآن.`;

    for (const admin of adminUsers) {
      await dispatchMultiChannelNotification({
        userId: admin._id.toString(),
        title,
        body,
        createdBy: userId,
        type: 'new_break_request',
        data: { breakRequestId: newRequest._id }
        
      });
    }
  } catch (error) {
    console.error(" Error dispatching break request notifications:", error);
  } 


  return NextResponse.json(newRequest);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await connect();
  const user = session?.user as CustomSessionUser | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const userId = user.id;

  // Return only this user's break requests
  const requests = await BreakRequest.find({ userId }).sort({
    requestedAt: -1,
  });
  return NextResponse.json(requests);
}
