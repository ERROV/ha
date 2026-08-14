import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import User from "@/models/User";
import connectDB from "@/utils/db";

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, phoneNumber, workHours } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Prepare update object
        const updateData: any = { name };

        // Phone number validation and sanitization
        if (phoneNumber !== undefined) {
            if (phoneNumber) {
                // Strip all non-digit characters
                const cleanedPhone = phoneNumber.replace(/\D/g, '');

                // Validate cleaned phone (10-15 digits)
                if (cleanedPhone && (cleanedPhone.length < 10 || cleanedPhone.length > 15)) {
                    return NextResponse.json({
                        error: "Phone number must be between 10-15 digits"
                    }, { status: 400 });
                }

                updateData.phoneNumber = cleanedPhone || null;
            } else {
                updateData.phoneNumber = null;
            }
        }

        // Work hours validation
        if (workHours !== undefined) {
            if (workHours && !["morning", "evening"].includes(workHours)) {
                return NextResponse.json({
                    error: "Invalid work hours. Must be 'morning' or 'evening'"
                }, { status: 400 });
            }
            updateData.workHours = workHours || null;
        }

        await connectDB();

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Profile updated successfully", user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
