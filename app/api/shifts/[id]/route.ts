// app/api/shifts/[id]/route.ts
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import connect from "@/utils/db";
import ShiftOffer from "@/models/ShiftOffer";
import { NextResponse } from "next/server";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connect();
  const shift = await ShiftOffer.findById(params.id);

  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
  if (shift.userId.toString() !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ShiftOffer.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Shift deleted" });
}
