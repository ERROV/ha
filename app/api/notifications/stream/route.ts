import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { connections } from "./notifier";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = (session.user as { id?: string })?.id;

    if (!userId) {
        return new Response("User ID not found", { status: 400 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
            );

            // Create writer for this connection
            const writer = {
                write: (data: string) => {
                    try {
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    } catch (error) {
                        console.error("Error writing to stream:", error);
                    }
                },
                close: () => {
                    try {
                        controller.close();
                    } catch (error) {
                        // Stream might already be closed
                    }
                },
            } as WritableStreamDefaultWriter;

            // Register this connection
            if (!connections.has(userId)) {
                connections.set(userId, new Set());
            }
            connections.get(userId)?.add(writer);

            console.log(`✅ SSE connection established for user: ${userId}`);

            // Keep-alive ping every 30 seconds
            const keepAliveInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": keep-alive\n\n"));
                } catch (error) {
                    clearInterval(keepAliveInterval);
                }
            }, 30000);

            // Cleanup on connection close
            request.signal.addEventListener("abort", () => {
                clearInterval(keepAliveInterval);
                connections.get(userId)?.delete(writer);

                if (connections.get(userId)?.size === 0) {
                    connections.delete(userId);
                }

                console.log(`❌ SSE connection closed for user: ${userId}`);

                try {
                    controller.close();
                } catch (error) {
                    // Stream already closed
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

