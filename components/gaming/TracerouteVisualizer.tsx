"use client";
import React, { useState } from "react";
import { FaNetworkWired, FaPlay, FaStop, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";

interface Hop {
    hop: number;
    ip: string;
    rtt: number;
    status: "good" | "warning" | "bad";
    location?: string;
}

const TracerouteVisualizer = () => {
    const [target, setTarget] = useState("8.8.8.8");
    const [hops, setHops] = useState<Hop[]>([]);
    const [loading, setLoading] = useState(false);

    const startTrace = async () => {
        if (loading) return;
        setLoading(true);
        setHops([]);

        try {
            const res = await fetch("/api/gaming/traceroute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target }),
            });
            const data = await res.json();

            // Animate items appearing
            if (data.hops && Array.isArray(data.hops)) {
                for (const hop of data.hops) {
                    await new Promise(r => setTimeout(r, 400)); // Slight delay for visual effect
                    setHops(prev => [...prev, hop]);
                }
            } else {
                setHops([{ hop: 0, ip: "Error", rtt: 0, status: "bad", location: "Could not trace" }]);
            }

        } catch (e) {
            setHops([{ hop: 0, ip: "Connection Failed", rtt: 0, status: "bad", location: "Check Network" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaNetworkWired className="text-primary" />
                Visual Traceroute
            </h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="Enter IP or Domain"
                    className="flex-1 p-2 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    onKeyDown={(e) => e.key === 'Enter' && startTrace()}
                />
                <button
                    onClick={startTrace}
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                    {loading ? <FaStop className="animate-pulse" /> : <FaPlay />}
                    {loading ? "Tracing..." : "Start"}
                </button>
            </div>

            <div className="flex-1 bg-muted/30 rounded-lg p-4 overflow-y-auto space-y-3 max-h-[300px] border border-border">
                {hops.length === 0 && !loading && (
                    <div className="text-center text-muted-foreground py-10">
                        Enter a target IP to visualize the route path.
                    </div>
                )}

                {hops.map((hop) => (
                    <motion.div
                        key={hop.hop}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${hop.status === "good" ? "bg-green-500/10 border-green-500/30" :
                            hop.status === "warning" ? "bg-yellow-500/10 border-yellow-500/30" :
                                "bg-destructive/10 border-destructive/30"
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${hop.status === "good" ? "bg-green-500 text-white" :
                            hop.status === "warning" ? "bg-yellow-500 text-black" :
                                "bg-destructive text-white"
                            }`}>
                            {hop.hop}
                        </div>

                        <div className="flex-1">
                            <div className="font-semibold text-foreground flex justify-between">
                                <span>{hop.ip}</span>
                                <span className={`text-sm ${hop.rtt < 20 ? "text-green-500" : hop.rtt < 100 ? "text-yellow-500" : "text-destructive"
                                    }`}>{hop.rtt > 0 ? `${hop.rtt}ms` : (hop.status === 'bad' ? '*' : '<1ms')}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{hop.location || "Node"}</div>
                        </div>

                        {hop.status === "good" ? <FaCheckCircle className="text-green-500" /> :
                            hop.status === "warning" ? <FaExclamationTriangle className="text-yellow-500" /> :
                                <FaTimesCircle className="text-destructive" />}
                    </motion.div>
                ))}

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center p-2"
                    >
                        <div className="animate-bounce text-primary text-2xl">...</div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TracerouteVisualizer;
