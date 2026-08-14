import { NextResponse } from "next/server";
import { exec } from "child_process";
import os from "os";

export async function POST(request: Request) {
    const { target } = await request.json();

    // Real path trace logic
    const isWindows = os.platform() === "win32";
    // Limit to 20 hops
    const command = isWindows
        ? `tracert -h 20 -d -w 500 ${target}` // -d: do not resolve addresses (faster), -w: timeout
        : `traceroute -m 20 -n -w 1 ${target}`;

    try {
        const hops = await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                // We process stdout even if there's an error code, because tracert often exits with error if target unreachable but still gave partial hops

                const lines = stdout.split('\n');
                const parsedHops = [];

                // Regex for Windows tracert:
                //  1    <1 ms    <1 ms    <1 ms  192.168.1.1
                //  2     *        *        *     Request timed out.
                // Regex matches: [HopNum] [RTT1] [RTT2] [RTT3] [IP/Message]
                const winRegex = /^\s*(\d+)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.*)$/;

                for (const line of lines) {
                    const trim = line.trim();
                    if (!trim || trim.startsWith("Tracing") || trim.startsWith("over")) continue;

                    const match = trim.match(winRegex);
                    if (match) {
                        const hopNum = parseInt(match[1]);
                        const rawRtts = [match[2], match[3], match[4]];
                        const lastPart = match[5].trim();

                        // Calculate average RTT
                        let totalRtt = 0;
                        let count = 0;
                        let isTimeout = true;

                        for (const r of rawRtts) {
                            if (r.includes("ms")) {
                                isTimeout = false;
                                const val = parseInt(r.replace('<', '').replace('ms', '').trim()) || 0;
                                totalRtt += val;
                                count++;
                            }
                        }

                        const avgRtt = count > 0 ? Math.round(totalRtt / count) : 0;
                        const status = isTimeout ? "bad" : (avgRtt > 100 ? "warning" : "good");
                        const ip = isTimeout ? "Request timed out" : lastPart;

                        // Fix for when lastPart is just the IP
                        // sometimes '1.2.3.4' or 'hostname [1.2.3.4]'

                        parsedHops.push({
                            hop: hopNum,
                            ip: ip,
                            rtt: avgRtt,
                            status: status,
                            location: isTimeout ? "Unreachable" : "Node"
                        });
                    } else if (!isWindows) {
                        // Simple Linux parser (fallback)
                        const parts = trim.split(/\s+/);
                        if (parts[0].match(/^\d+$/)) {
                            parsedHops.push({
                                hop: parseInt(parts[0]),
                                ip: parts[1],
                                rtt: parseFloat(parts[2]) || 0,
                                status: "good",
                                location: "Node"
                            });
                        }
                    }
                }
                resolve(parsedHops);
            });
        });

        return NextResponse.json({ hops });
    } catch (e) {
        return NextResponse.json({ hops: [] });
    }
}
