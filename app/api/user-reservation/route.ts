// app/api/user-reservation/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import Reservation from "@/models/Reservation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

interface User {
  id: string;
  name: string;
  email: string;
}

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session.user as User;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  await connect();
  
  // Check if user already has a booking
  const existingUserBooking = await Reservation.findOne({ user: user.id });
  
  return NextResponse.json({ 
    booking: existingUserBooking,
    hasBooking: !!existingUserBooking 
  });
}