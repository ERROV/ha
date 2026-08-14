// app/api/timeslots/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import Reservation from "@/models/Reservation";

const MORNING_TIMES = ["10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30"];
const EVENING_TIMES = [
  "6:30",
  "7:00",
  "7:30",
  "8:00",
  "8:30",
  "9:00",
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
];

function getBaghdadTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 60 * 60 * 1000); // UTC+3
}

function isBetween(start: string, end: string, now: Date) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (startMin > endMin) return nowMin >= startMin || nowMin < endMin;
  return nowMin >= startMin && nowMin < endMin;
}

export async function GET() {
  try {
    await connect();

    const now = getBaghdadTime();
    const showMorning = isBetween("08:30", "16:30", now);
    const showEvening = isBetween("16:30", "00:30", now);

    // Enforce strict booking window availability per shift schedule
    const shift = showMorning ? "morning" : showEvening ? "evening" : null;

    if (!shift) return NextResponse.json([]);

    const TIMES = shift === "morning" ? MORNING_TIMES : EVENING_TIMES;

    const reservations = await Reservation.find({ shift }).populate("user", "name").lean();

    const data = TIMES.map(time => ({
      time,
      bookings: reservations.filter(r => r.timeSlot === time),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/timeslots GET:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
