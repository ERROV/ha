export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import Reservation from "@/models/Reservation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session?.user as CustomSessionUser | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await connect();

  try {
    await Reservation.deleteMany({});
    return new NextResponse("All reservations cleared", { status: 200 });
    
  } catch (error) {
    return new NextResponse("Failed to clear reservations", { status: 500 });
  }
}
