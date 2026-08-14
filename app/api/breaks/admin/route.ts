import { NextResponse } from "next/server";
import connect from "@/utils/db";
import BreakRequest from "@/models/BreakRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
export const dynamic = 'force-dynamic';

interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as CustomSessionUser | undefined;
  if (!session || user?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connect();

  const requests = await BreakRequest.find().sort({ requestedAt: -1 });
  return NextResponse.json(requests);
}