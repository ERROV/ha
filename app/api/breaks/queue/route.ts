// app/api/breakRequests/queue/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import BreakRequest from "@/models/BreakRequest";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function calculateEstimatedWait(position: number, breakDurationMinutes: number = 10) {
  return position * breakDurationMinutes;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await connect();

  const user = session.user as CustomSessionUser;
  const now = new Date();

  // Fetch active break requests sorted by request time
  const activeRequests = await BreakRequest.find({
    $or: [
      { status: "pending" },
      {
        status: "approved",
        expiresAt: { $gt: now }
      }
    ]
  }).sort({ requestedAt: 1 });

  // Build queue array for both admin and regular users
  const queue = activeRequests.map((req, index) => ({
    userId: req.userId,
    userName: req.userName,
    status: req.status,
    position: index + 1,
    estimatedWaitMinutes: calculateEstimatedWait(index),
    expiresAt: req.expiresAt,
    requestedAt: req.requestedAt
  }));

  if (user.role === "admin") {
    return NextResponse.json(queue);
  } else {
    // Find user's active request
    const userRequest = activeRequests.find(
      (r) => r.userId === user.id &&
        (r.status === "pending" ||
          (r.status === "approved" && r.expiresAt > now))
    );

    if (!userRequest) {
      return NextResponse.json({
        message: "No active break request found in the queue.",
        position: null,
        beforeCount: 0,
        afterCount: 0,
        estimatedWaitMinutes: 0,
        queue // Add queue to response for regular users
      });
    }

    const userIndex = activeRequests.findIndex(r => r._id.equals(userRequest._id));

    return NextResponse.json({
      userId: user.id,
      userName: user.name,
      status: userRequest.status,
      position: userIndex + 1,
      beforeCount: userIndex,
      afterCount: activeRequests.length - userIndex - 1,
      estimatedWaitMinutes: calculateEstimatedWait(userIndex),
      expiresAt: userRequest.expiresAt,
      queue // Add queue to response for regular users
    });
  }
}