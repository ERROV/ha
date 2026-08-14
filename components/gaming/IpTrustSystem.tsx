"use client";
import React, { useState } from "react";
import { FaShieldAlt, FaCheck, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";

const IpTrustSystem = () => {
    const [ip, setIp] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleTrust = () => {
        if (!ip) return;
        setStatus("loading");

        // Simulate API call
        setTimeout(() => {
            setStatus("success");
            toast.success(`IP ${ip} added to Global Whitelist`);
            setTimeout(() => {
                setStatus("idle");
                setIp("");
            }, 3000);
        }, 1500);
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaShieldAlt className="text-primary" />
                IP Trust System
            </h3>

            <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/20 p-2 rounded-full text-primary">
                            <FaLock />
                        </div>
                        <div className="text-sm font-semibold text-foreground">DMZ Bypass Mode</div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Whitelisting an IP bypasses standard firewall filtering and prioritizes gaming traffic.
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        placeholder="Client IP (e.g. 10.100.x.x)"
                        disabled={status !== "idle"}
                        className="flex-1 p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    />
                    <button
                        onClick={handleTrust}
                        disabled={status !== "idle" || !ip}
                        className={`px-4 py-2 rounded-md font-semibold transition-all flex items-center gap-2
                    ${status === "idle" ? "bg-primary text-primary-foreground hover:opacity-90" :
                                status === "loading" ? "bg-muted text-muted-foreground cursor-wait" :
                                    "bg-green-600 text-white"
                            }`}
                    >
                        {status === "idle" && "Trust IP"}
                        {status === "loading" && "Processing..."}
                        {status === "success" && <FaCheck />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IpTrustSystem;
