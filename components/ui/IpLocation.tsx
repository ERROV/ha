"use client";
import React, { useState, useEffect } from "react";
import { FaGlobeAmericas, FaMapMarkerAlt, FaSearch, FaHistory } from "react-icons/fa";
import { motion } from "framer-motion";

const IpLocation = () => {
    const [inputIp, setInputIp] = useState("");
    const [data, setData] = useState<{ ip: string; country_name: string; city?: string; region?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchIpInfo = async (ipAddress: string = "") => {
        setLoading(true);
        setError("");
        try {
            const url = ipAddress ? `https://ipapi.co/${ipAddress}/json/` : "https://ipapi.co/json/";
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch location data");
            const json = await response.json();

            if (json.error) {
                throw new Error(json.reason || "Invalid IP address");
            }

            setData({
                ip: json.ip,
                country_name: json.country_name,
                city: json.city,
                region: json.region
            });
            setInputIp(json.ip);
        } catch (err: any) {
            console.error("IP Fetch Error:", err);
            setError(err.message || "Unable to fetch IP info.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch current IP on mount
    useEffect(() => {
        fetchIpInfo();
    }, []);

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputIp.trim()) {
            fetchIpInfo(inputIp.trim());
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaGlobeAmericas className="text-primary" />
                IP Geolocation
            </h3>

            <div className="flex-1 space-y-4">
                {/* Search Form */}
                <form onSubmit={handleLookup} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputIp}
                            onChange={(e) => setInputIp(e.target.value)}
                            placeholder="Enter IP (e.g. 8.8.8.8)"
                            className="w-full p-2.5 pl-9 rounded-md bg-input border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono text-foreground"
                        />
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? "..." : "LOOKUP"}
                    </button>
                </form>

                {/* Results Area */}
                <div className="min-h-[140px] flex flex-col justify-center">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-16 bg-muted rounded-lg w-full"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-center">
                            <p className="text-destructive text-sm font-medium">{error}</p>
                            <button
                                onClick={() => fetchIpInfo()}
                                className="text-[10px] text-primary underline mt-2 uppercase font-bold"
                            >
                                Reset to My IP
                            </button>
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Location Found</span>
                                        <span className="text-lg font-bold text-primary truncate max-w-[180px]">
                                            {data.country_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="pl-11 text-xs text-muted-foreground italic">
                                    {data.city && `${data.city}, `}{data.region}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] bg-muted/30 px-3 py-2 rounded-md">
                                <span className="text-muted-foreground font-semibold uppercase">Target IP</span>
                                <span className="font-mono text-foreground font-bold">{data.ip}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            Enter an IP address to see its location details.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    IP Intelligence Tool
                </span>
                <button
                    onClick={() => fetchIpInfo()}
                    disabled={loading}
                    className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 font-bold transition-colors"
                >
                    <FaHistory className="text-[8px]" /> MY IP
                </button>
            </div>
        </div>
    );
};

export default IpLocation;
