export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import ShiftSwap from "@/models/ShiftSwap";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();
    const swaps = await ShiftSwap.find({})
      .populate("offeredBy", "name email")
      .populate("takenBy", "name email")
      .sort({ date: -1 });

    return NextResponse.json(swaps);
  } catch (error) {
    console.error("Error fetching swaps:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
