import { NextResponse } from "next/server";
import net from "net";

export async function POST(request: Request) {
    try {
        const { host, port } = await request.json();

        if (!host || !port) {
            return NextResponse.json({ error: "Host and Port required" }, { status: 400 });
        }

        const checkPort = (host: string, port: number) => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(2000); // 2s timeout

                socket.on("connect", () => {
                    socket.destroy();
                    resolve(true);
                });

                socket.on("timeout", () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.on("error", () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.connect(port, host);
            });
        };

        const isOpen = await checkPort(host, port);
        return NextResponse.json({ open: isOpen, host, port });

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
