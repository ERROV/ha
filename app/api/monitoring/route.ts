// app/api/monitoring/route.ts
import { NextResponse } from "next/server";
import ping from "ping";
export const dynamic = 'force-dynamic';

// Define the rawGroups directly in the API route
const rawGroups = {
  SHAOLT: ["10.80.11.72", "10.80.11.65", "10.80.11.65", "10.80.11.65", "10.80.11.65"],
  BAYOLT: ["10.80.8.65", "10.80.8.65", "10.80.8.65", "10.80.8.65", "10.80.8.65"],
  BELEDIYAT: ["10.80.13.65"],
  KADOLT: ["10.80.9.67", "10.80.9.67"],
  MAMOLT: ["10.80.10.2"],
  OMCOLT: ["10.80.12.65"],
};

// Global servers remain separate as they are not part of the OLT groups
const GLOBAL_SERVERS = [
  { name: "Google DNS", ip: "8.8.8.8" },
  { name: "Cloudflare DNS", ip: "1.1.1.1" },
  { name: "AWS", ip: "13.248.118.1" }, // Example IP - unofficial
  { name: "Steam", ip: "208.64.200.10" }, // Example IP - unofficial
];

export async function GET() {
  try {
    // Process OLT groups from rawGroups
    const groupedOltsStatus = await Promise.all(
      Object.entries(rawGroups).map(async ([groupName, ips]) => {
        const oltsInGroup = await Promise.all(
          ips.map(async (ip, index) => {
            // Add index to key for uniqueness if IPs repeat in a group
            const res = await ping.promise.probe(ip, { timeout: 2 });
            return {
              ip: ip,
              status: res.alive ? "online" : "offline",
              latency: res.alive ? Number(res.time) : null,
            };
          })
        );
        return {
          groupName: groupName,
          olts: oltsInGroup,
        };
      })
    );

    // Process global servers (remains unchanged)
    const serversStatus = await Promise.all(
      GLOBAL_SERVERS.map(async (server) => {
        const res = await ping.promise.probe(server.ip, { timeout: 2 });
        return {
          name: server.name,
          status: res.alive ? "online" : "offline",
          latency: res.alive ? Number(res.time) : null,
        };
      })
    );

    // Return the structured response
    return NextResponse.json({ groupedOlts: groupedOltsStatus, servers: serversStatus });
  } catch (error) {
    console.error("Monitoring API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}