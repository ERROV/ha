"use client";
import React, { useState } from "react";
import { FaServer, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

const PortChecker = () => {
    const [host, setHost] = useState("");
    const [port, setPort] = useState("80");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"open" | "closed" | "error" | null>(null);

    const checkPort = async () => {
        if (!host || !port) return;
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch("/api/tools/port-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ host, port: parseInt(port) }),
            });
            const data = await res.json();
            setStatus(data.open ? "open" : "closed");
        } catch (error) {
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaServer className="text-primary" />
                Port Checker
            </h3>

            <div className="flex flex-col gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Host (e.g. google.com)"
                    className="w-full p-2 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Port (e.g. 443)"
                    className="w-full p-2 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                />
            </div>

            <button
                onClick={checkPort}
                disabled={loading}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-medium mb-4 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading && <FaSpinner className="animate-spin" />}
                Check Status
            </button>

            {status && (
                <div className={`mt-auto p-3 rounded-lg border flex items-center justify-center gap-2 font-bold
          ${status === "open" ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" :
                        status === "closed" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                            "bg-yellow-500/10 border-yellow-500/30 text-yellow-600"
                    }`}
                >
                    {status === "open" && <><FaCheck /> Port Open</>}
                    {status === "closed" && <><FaTimes /> Port Closed</>}
                    {status === "error" && "Error checking"}
                </div>
            )}
        </div>
    );
};

export default PortChecker;
