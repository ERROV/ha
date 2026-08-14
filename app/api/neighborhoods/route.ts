// app/api/neighborhoods/route.ts
import { NextResponse } from 'next/server';
import connect from '@/utils/db';
import Neighborhood from '@/models/Neighborhood';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions'; // مسار auth حسب مشروعك
export const dynamic = 'force-dynamic';


interface CustomSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
// GET: Get all neighborhoods
export async function GET() {
  await connect();
  const neighborhoods = await Neighborhood.find();
  return NextResponse.json(neighborhoods);
}

// POST: Create or Update neighborhood (admin only)
export async function POST(req: Request) {
  await connect();
  const session = await getServerSession(authOptions) as { user: CustomSessionUser };
  if (!session || !session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { district, parent } = body;

  if (!district || !parent) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const updated = await Neighborhood.findOneAndUpdate(
    { district },
    { parent },
    { upsert: true, new: true }
  );

  return NextResponse.json(updated);
}
