import { NextResponse } from "next/server";
import connect from "@/utils/db";
import BreakRequest from "@/models/BreakRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { dispatchMultiChannelNotification } from "@/utils/notification-dispatcher";

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { status } = await request.json();
  if (!["approved", "rejected"].includes(status)) {
    return new NextResponse("Invalid status", { status: 400 });
  }

  await connect();

  const breakRequest = await BreakRequest.findById(params.id);
  if (!breakRequest) return new NextResponse("Not found", { status: 404 });

  breakRequest.status = status;
  if (status === "approved") {
    breakRequest.approvedAt = new Date();
  }
  await breakRequest.save();

  // 🔔 Notify the employee
  try {
    const title = status === "approved" ? "تم قبول طلب البريك ✅" : "تم رفض طلب البريك ❌";
    const body = status === "approved"
      ? "تمت الموافقة على طلب البريك الخاص بك. يمكنك البدء الآن."
      : "نعتذر، تم رفض طلب البريك الخاص بك.";

    await dispatchMultiChannelNotification({
      userId: breakRequest.userId,
      title,
      body,
      createdBy: (session.user as any).id,
      type: 'break_decision',
      data: { breakRequestId: breakRequest._id, status }
    });
  } catch (error) {
    console.error("❌ Error dispatching break decision notification:", error);
  }

  return NextResponse.json(breakRequest);
}
