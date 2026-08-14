export const dynamic = 'force-dynamic';
import connect from "@/utils/db";
import ShiftOffer from "@/models/ShiftOffer";
import "@/models/User"; 
import { NextResponse } from "next/server";
import { DateTime } from "luxon";

export async function GET() {
  await connect();

  const baghdadMidnight = DateTime.now()
    .setZone("Asia/Baghdad")
    .startOf("day")
    .toJSDate();

  await ShiftOffer.deleteMany({ date: { $lt: baghdadMidnight } });

  const shifts = await ShiftOffer.find({ date: { $gte: baghdadMidnight } })
    .populate("userId", "name email")
    .sort({ date: 1 });

  return NextResponse.json(shifts);
}
