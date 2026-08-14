export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import Settings from "@/models/Settings";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

interface CustomSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

export async function GET() {
  await connect();
  try {
    const config = await Settings.findOne({ configKey: "LUNCH_CONFIG" });
    const singleTimes = config?.singleEmployeeTimes || [
      "morning_12:00", "morning_12:30", "morning_1:00", "morning_1:30", "morning_2:00", "morning_2:30"
    ];
    return NextResponse.json({ singleEmployeeTimes: singleTimes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session?.user as CustomSessionUser | undefined;
  if (user?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { singleEmployeeTimes } = await request.json();
    if (!Array.isArray(singleEmployeeTimes)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    await connect();
    await Settings.findOneAndUpdate(
      { configKey: "LUNCH_CONFIG" },
      { singleEmployeeTimes, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, singleEmployeeTimes });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
