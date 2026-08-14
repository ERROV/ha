// app/api/users/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import User from "@/models/User";
import Reservation from "@/models/Reservation";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session?.user as CustomSessionUser | undefined;
  if (!user || user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  try {
    const body = await request.json();
    await connect();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
    if (body.workHours !== undefined) updateData.workHours = body.workHours;

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 5);
    }

    const updatedUser = await User.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = session?.user as CustomSessionUser | undefined;
  if (!user || user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  await connect();

  await Reservation.deleteMany({ user: params.id });
  await User.findByIdAndDelete(params.id);

  return new NextResponse("User deleted", { status: 200 });
}
