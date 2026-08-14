"use client";
import React from "react";
import { FaGlobe, FaWifi } from "react-icons/fa";

const SERVERS = [
    { region: "Valve (Dubai)", ping: 25, status: "good" },
    { region: "Riot (Bahrain)", ping: 28, status: "good" },
    { region: "EA (Germany)", ping: 85, status: "warning" },
    { region: "Epic (Europe)", ping: 92, status: "warning" },
    { region: "Valve (EU West)", ping: 95, status: "warning" },
];

const ServerStatus = () => {
    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaGlobe className="text-primary" />
                Regional Server Status
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2">
                {SERVERS.map((server) => (
                    <div key={server.region} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${server.status === "good" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                                    server.status === "warning" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" :
                                        "bg-destructive"
                                }`} />
                            <span className="font-medium text-foreground">{server.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${server.ping < 50 ? "text-green-500" : server.ping < 100 ? "text-yellow-500" : "text-destructive"
                                }`}>
                                {server.ping}ms
                            </span>
                            <FaWifi className="text-xs text-muted-foreground" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServerStatus;
