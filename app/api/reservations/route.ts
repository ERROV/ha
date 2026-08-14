// app/api/reservations/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import Reservation from "@/models/Reservation";
import Settings from "@/models/Settings";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

const MORNING_TIMES = ["10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30"];
const EVENING_TIMES = [
  "6:30", "7:00", "7:30",
  "8:00", "8:30", "9:00", "9:30",
  "10:00", "10:30", "11:00", "11:30",
];

function getBaghdadTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 60 * 60 * 1000); // UTC+3
}

function isBetween(start: string, end: string, now: Date): boolean {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (startMin > endMin) return nowMin >= startMin || nowMin < endMin;
  return nowMin >= startMin && nowMin < endMin;
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session.user as any;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { timeSlot } = await request.json();
  await connect();

  const now = getBaghdadTime();
  const morningShift = isBetween("08:30", "16:30", now);
  const eveningShift = isBetween("16:30", "00:30", now);

  // Enforce strict booking availability window between 8:30 AM and 12:30 AM (Baghdad time)
  const shift = morningShift ? "morning" : eveningShift ? "evening" : null;
  if (!shift) return new NextResponse("Booking is only available between 8:30 AM and 12:30 AM (Baghdad time).", { status: 400 });

  const validTimes = shift === "morning" ? MORNING_TIMES : EVENING_TIMES;
  if (!validTimes.includes(timeSlot)) return new NextResponse("Invalid time slot for current shift", { status: 400 });

  const existingUserBooking = await Reservation.findOne({ user: user.id });
  if (existingUserBooking) return new NextResponse("You already booked a time slot", { status: 400 });

  const bookingsCount = await Reservation.countDocuments({ timeSlot, shift });
  const config = await Settings.findOne({ configKey: "LUNCH_CONFIG" });
  const singleTimes = config?.singleEmployeeTimes || [
    "morning_12:00", "morning_12:30", "morning_1:00", "morning_1:30", "morning_2:00", "morning_2:30"
  ];
  const maxBookings = singleTimes.includes(`${shift}_${timeSlot}`) ? 1 : 2;

  if (bookingsCount >= maxBookings) return new NextResponse("This time slot is full", { status: 400 });

  const newBooking = new Reservation({ timeSlot, shift, user: user.id });
  await newBooking.save();

  return new NextResponse("Booked successfully", { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  await connect();

  const now = getBaghdadTime();
  const morningShift = isBetween("08:30", "16:30", now);
  const eveningShift = isBetween("16:30", "00:30", now);

  // Enforce strict booking availability window between 8:30 AM and 12:30 AM (Baghdad time)
  const shift = morningShift ? "morning" : eveningShift ? "evening" : null;
  if (!shift) return NextResponse.json({ error: "Booking is only available between 8:30 AM and 12:30 AM (Baghdad time)." }, { status: 400 });

  const reservations = await Reservation.find({ shift })
    .populate('user', 'name')
    .sort({ timeSlot: 1 });

  // Group by time slot
  const timeslots: { [key: string]: { time: string, bookings: any[], maxBookings: number } } = {};
  const validTimes = shift === "morning" ? MORNING_TIMES : EVENING_TIMES;

  const config = await Settings.findOne({ configKey: "LUNCH_CONFIG" });
  const singleTimes = config?.singleEmployeeTimes || [
    "morning_12:00", "morning_12:30", "morning_1:00", "morning_1:30", "morning_2:00", "morning_2:30"
  ];

  validTimes.forEach(time => {
    timeslots[time] = {
      time,
      bookings: reservations.filter((r: any) => r.timeSlot === time),
      maxBookings: singleTimes.includes(`${shift}_${time}`) ? 1 : 2
    };
  });

  return NextResponse.json(Object.values(timeslots));
}