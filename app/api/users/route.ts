// app/api/users/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import connect from "@/utils/db";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const user = session?.user as CustomSessionUser | undefined;
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (user.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  await connect();

  const users = await User.find({}).lean();

  return NextResponse.json(users);
}
