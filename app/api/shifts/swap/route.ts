export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import ShiftOffer from "@/models/ShiftOffer";
import ShiftSwap from "@/models/ShiftSwap";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, takenShiftType } = await req.json();
  if (!offerId || !takenShiftType)
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

  await connect();

  const offer = await ShiftOffer.findById(offerId);
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  await ShiftSwap.create({
    offeredBy: offer.userId,
    offeredShiftType: offer.type,
    takenBy: session.user.id,
    takenShiftType,
    date: offer.date,
  });

  await ShiftOffer.findByIdAndDelete(offerId);

  return NextResponse.json({ message: "Shift swapped" });
}
