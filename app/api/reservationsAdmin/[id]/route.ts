// app/api/reservations/[id]/route.ts
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
const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
  

    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized - no session", { status: 401, headers: noCacheHeaders });
    }

    const user = session.user as CustomSessionUser | undefined;
    if (!user) {
      return new NextResponse("Unauthorized - no user in session", { status: 401, headers: noCacheHeaders });
    }

    const userId = user.id;
    const reservationId = params.id;

    if (!reservationId) {
      return new NextResponse("Bad Request - missing reservation ID", { status: 400, headers: noCacheHeaders });
    }

    await connect();

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return new NextResponse("Reservation not found", { status: 404, headers: noCacheHeaders });
    }

    if (reservation.user.toString() !== userId && user.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403, headers: noCacheHeaders });
    }

    await reservation.deleteOne();
    return new NextResponse("Reservation deleted", { status: 200, headers: noCacheHeaders });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return new NextResponse("Internal Server Error", { status: 500, headers: noCacheHeaders });
  }
}
