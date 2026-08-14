import { NextResponse } from "next/server";
import { exec } from "child_process";
import net from "net";
import os from "os";

const checkPort = (host: string, port: number, timeout = 400): Promise<boolean> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
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

const pingHost = (host: string): Promise<{ alive: boolean; time?: number }> => {
    return new Promise((resolve) => {
        // Detect OS for correct ping command
        const isWindows = os.platform() === "win32";
        const command = isWindows
            ? `ping -n 1 -w 500 ${host}`
            : `ping -c 1 -W 1 ${host}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve({ alive: false });
                return;
            }

            // Parse output for time
            const timeMatch = stdout.match(/time[=<](\d+)ms/i); // Matches time=10ms or time<1ms
            const time = timeMatch ? parseInt(timeMatch[1]) : 1;

            // Check for success keywords (Windows: "Reply from", Linux: "bytes from")
            const isAlive = stdout.toLowerCase().includes("ttl=");

            resolve({ alive: isAlive, time: isAlive ? time : undefined });
        });
    });
};

export async function POST(request: Request) {
    try {
        const { target } = await request.json();

        // 1. Ping the host (Real Ping)
        const pingResult = await pingHost(target);

        if (!pingResult.alive) {
            return NextResponse.json({ target, alive: false });
        }

        // 2. Scan Ports (Real Scan if alive)
        // Only scan a few common ports to keep it fast
        const commonPorts = [80, 443, 8080, 22, 21, 3389, 53, 445];
        const openPorts: number[] = [];

        // Run port checks in parallel
        await Promise.all(commonPorts.map(async (port) => {
            const isOpen = await checkPort(target, port, 300);
            if (isOpen) openPorts.push(port);
        }));

        return NextResponse.json({
            target,
            alive: true,
            time: pingResult.time,
            hostname: "", // Hard to get hostname without RDNS lookup which is slow
            ports: openPorts.sort((a, b) => a - b)
        });

    } catch (e) {
        return NextResponse.json({ target: "error", alive: false });
    }
}
