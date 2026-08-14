export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";


let lunchformVisible =true;

export async function GET() {
  return NextResponse.json({ visible: lunchformVisible });
}

export async function PATCH(req: Request) {
  try {
    const { visible } = await req.json();
    lunchformVisible = !!visible;
    return NextResponse.json({ success: true, visible: lunchformVisible });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
