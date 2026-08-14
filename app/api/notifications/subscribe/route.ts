import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import User from "@/models/User";
import connect from "@/utils/db";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { subscription } = await req.json();
        if (!subscription || !subscription.endpoint) {
            return new NextResponse("Invalid subscription data", { status: 400 });
        }

        await connect();
        const userId = (session.user as { id: string }).id;

        await User.findByIdAndUpdate(userId, {
            pushSubscription: subscription
        });

        console.log(`✅ Push subscription saved for user: ${userId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("❌ Error saving push subscription:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
