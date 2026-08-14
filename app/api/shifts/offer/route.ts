export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import ShiftOffer from "@/models/ShiftOffer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, date } = await req.json();
  if (!type || !date) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  await connect();
  if (!session.user || !session.user.id) {
    return NextResponse.json({ error: "User information missing in session" }, { status: 400 });
  }

  const newOffer = await ShiftOffer.create({
    userId: session.user.id,
    type,
    date: new Date(date),
  });

  return NextResponse.json(newOffer);
}
