import { NextResponse } from "next/server";

export async function POST(request: Request) {
    // In a real scenario, use 'ping' package or 'exec' to run system ping
    // For this dashboard demo, we return simulated data to ensure it works in all environments
    const { target } = await request.json();

    // Simulate varying ping
    const rtt = Math.floor(Math.random() * 50) + 10;

    return NextResponse.json({
        target,
        alive: true,
        time: rtt
    });
}
