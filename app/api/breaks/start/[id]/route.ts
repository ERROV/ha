import { NextResponse } from "next/server";
import connect from "@/utils/db";
import BreakRequest from "@/models/BreakRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import User from "@/models/User";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await connect();

  const breakRequest = await BreakRequest.findById(params.id);
  if (!breakRequest) return new NextResponse("Not found", { status: 404 });

  if (breakRequest.userId !== (session.user as any).id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (breakRequest.status !== "approved") {
    return new NextResponse("Break not approved", { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  breakRequest.startedAt = now;
  breakRequest.expiresAt = expiresAt;
  await breakRequest.save();

  // 🔔 Notify Admins
  try {
    const adminUsers = await User.find({ role: "admin" });
    const title = "بدأ الموظف البريك 🏃‍♂️";
    const body = `الموظف ${breakRequest.userName} بدأ البريك الآن(10 دقائق).`;

    for (const admin of adminUsers) {
      await dispatchMultiChannelNotification({
        userId: admin._id.toString(),
        title,
        body,
        createdBy: breakRequest.userId,
        type: 'break_start',
        data: { breakRequestId: breakRequest._id }
      });
    }
  } catch (error) {
    console.error("❌ Error dispatching break start notification:", error);
  }

  return NextResponse.json(breakRequest);
}
