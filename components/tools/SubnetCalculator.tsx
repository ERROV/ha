"use client";
import React, { useState } from "react";
import { FaNetworkWired, FaCalculator } from "react-icons/fa";
import { motion } from "framer-motion";

const SubnetCalculator = () => {
    const [ip, setIp] = useState("");
    const [cidr, setCidr] = useState("24");
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        if (!ip) return;

        // Basic Validation
        const ipParts = ip.split(".").map(Number);
        if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
            setResult({ error: "Invalid IP Address" });
            return;
        }

        const mask = parseInt(cidr);
        if (isNaN(mask) || mask < 0 || mask > 32) {
            setResult({ error: "Invalid Mask" });
            return;
        }

        // Calculation
        const binaryIp = ipParts.map(part => part.toString(2).padStart(8, "0")).join("");
        const networkBinary = binaryIp.substring(0, mask).padEnd(32, "0");
        const broadcastBinary = binaryIp.substring(0, mask).padEnd(32, "1");

        const binToIp = (bin: string) => bin.match(/.{8}/g)?.map(b => parseInt(b, 2)).join(".") || "";

        const network = binToIp(networkBinary);
        const broadcast = binToIp(broadcastBinary);
        const hosts = mask === 32 ? 1 : mask === 31 ? 2 : Math.pow(2, 32 - mask) - 2;

        // Network Class
        const firstOctet = ipParts[0];
        let netClass = "A";
        if (firstOctet >= 128 && firstOctet < 192) netClass = "B";
        else if (firstOctet >= 192 && firstOctet < 224) netClass = "C";
        else if (firstOctet >= 224 && firstOctet < 240) netClass = "D";
        else if (firstOctet >= 240) netClass = "E";

        setResult({
            network,
            broadcast,
            netmask: binToIp("1".repeat(mask).padEnd(32, "0")),
            hosts: hosts > 0 ? hosts.toLocaleString() : "0",
            range: `${network} - ${broadcast}`,
            class: netClass,
            binary: `${binaryIp.substring(0, 8)}.${binaryIp.substring(8, 16)}.${binaryIp.substring(16, 24)}.${binaryIp.substring(24, 32)}`
        });
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaCalculator className="text-primary" />
                Subnet Calculator
            </h3>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground ml-1">IP Address</label>
                        <input
                            type="text"
                            placeholder="192.168.1.1"
                            className="w-full p-2.5 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm font-mono"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                        />
                    </div>
                    <div className="w-24 space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground ml-1">CIDR</label>
                        <input
                            type="number"
                            placeholder="24"
                            className="w-full p-2.5 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm font-mono"
                            value={cidr}
                            onChange={(e) => setCidr(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                    {[24, 25, 26, 27, 28, 29, 30].map(m => (
                        <button
                            key={m}
                            onClick={() => { setCidr(m.toString()); setTimeout(calculate, 0); }}
                            className="px-2 py-1 bg-muted hover:bg-muted/80 rounded border border-border text-foreground transition-colors"
                        >
                            /{m}
                        </button>
                    ))}
                </div>

                <button
                    onClick={calculate}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-bold text-sm tracking-wide shadow-sm"
                >
                    Calculate Subnet
                </button>
            </div>

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50 text-sm"
                >
                    {result.error ? (
                        <p className="text-destructive font-semibold text-center">{result.error}</p>
                    ) : (
                        <>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                                <span className="text-muted-foreground">Network:</span>
                                <span className="font-mono font-bold text-primary">{result.network}/{cidr}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Netmask</span>
                                    <span className="font-mono text-foreground">{result.netmask}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Broadcast</span>
                                    <span className="font-mono text-foreground">{result.broadcast}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Usable Hosts</span>
                                    <span className="font-mono text-foreground">{result.hosts}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Class</span>
                                    <span className="font-mono text-foreground">{result.class}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground block mb-1">IP Binary</span>
                                <span className="font-mono text-[10px] text-muted-foreground tracking-widest break-all">
                                    {result.binary}
                                </span>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default SubnetCalculator;
