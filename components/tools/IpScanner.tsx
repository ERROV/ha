"use client";
import React, { useState, useRef } from "react";
import { FaDesktop, FaPlay, FaStop, FaNetworkWired, FaCalculator } from "react-icons/fa";
import { motion } from "framer-motion";

type ScanResult = {
    ip: string;
    status: "alive" | "dead" | "scanning" | "pending";
    ping: number | null;
    hostname?: string;
    ports?: number[];
};

const IpScanner = () => {
    const [cidr, setCidr] = useState("192.168.1.0/24");
    const [startIp, setStartIp] = useState("192.168.1.1");
    const [endIp, setEndIp] = useState("192.168.1.254");
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [progress, setProgress] = useState(0);

    // Ref to track scanning state across async closures
    const isScanningRef = useRef(false);

    // Helper: CIDR to Range
    const calculateRange = (cidrInput: string) => {
        try {
            const [ip, maskStr] = cidrInput.split('/');
            if (!ip || !maskStr) return;

            const mask = parseInt(maskStr);
            if (mask < 0 || mask > 32) return;

            const ipParts = ip.split('.').map(Number);
            const binaryIp = ipParts.map(part => part.toString(2).padStart(8, "0")).join("");
            const networkBinary = binaryIp.substring(0, mask).padEnd(32, "0");
            const broadcastBinary = binaryIp.substring(0, mask).padEnd(32, "1");

            const binToIp = (bin: string) => bin.match(/.{8}/g)?.map(b => parseInt(b, 2)).join(".") || "";

            const network = binToIp(networkBinary);
            const broadcast = binToIp(broadcastBinary);

            // Start = Network + 1, End = Broadcast - 1 (usable range)
            const startParts = network.split('.').map(Number);
            startParts[3]++;

            const endParts = broadcast.split('.').map(Number);
            endParts[3]--;

            const newStart = startParts.join('.');
            const newEnd = endParts.join('.');

            setStartIp(newStart);
            setEndIp(newEnd);

            return { start: newStart, end: newEnd };
        } catch (e) {
            return null;
        }
    };

    const ipToLong = (ip: string) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const longToIp = (long: number) => [long >>> 24, (long >> 16) & 255, (long >> 8) & 255, long & 255].join('.');

    // Stop Handler
    const stopScan = () => {
        isScanningRef.current = false;
        setScanning(false);
    };

    const handleScan = async () => {
        if (scanning) {
            stopScan();
            return;
        }

        isScanningRef.current = true;
        setScanning(true);
        // setResults([]);
        setProgress(0);

        const start = ipToLong(startIp);
        const end = ipToLong(endIp);

        if (isNaN(start) || isNaN(end) || start > end) {
            alert("Invalid IP Range");
            stopScan();
            return;
        }

        const total = end - start + 1;

        if (total > 512) {
            if (!confirm(`You are about to scan ${total} IPs. This might take a while. Continue?`)) {
                stopScan();
                return;
            }
        }

        // Initialize queue
        const initialList: ScanResult[] = [];
        for (let i = start; i <= end; i++) {
            initialList.push({ ip: longToIp(i), status: "pending", ping: null });
        }
        setResults(initialList);

        let completed = 0;
        const batchSize = 12; // Parallelism

        for (let i = 0; i < initialList.length; i += batchSize) {
            if (!isScanningRef.current) break;

            const batch = initialList.slice(i, i + batchSize);
            await Promise.all(batch.map(async (item) => {
                if (!isScanningRef.current) return;

                // Mark scanning
                setResults(prev => prev.map(r => r.ip === item.ip ? { ...r, status: "scanning" } : r));

                try {
                    const res = await fetch("/api/tools/network-scan", {
                        method: "POST",
                        body: JSON.stringify({ target: item.ip }),
                    });
                    const data = await res.json();

                    if (isScanningRef.current) {
                        setResults(prev => prev.map(r => r.ip === item.ip ? {
                            ip: item.ip,
                            status: data.alive ? "alive" : "dead",
                            ping: data.time || null,
                            hostname: data.hostname,
                            ports: data.ports
                        } : r));
                    }
                } catch (e) {
                    if (isScanningRef.current) {
                        setResults(prev => prev.map(r => r.ip === item.ip ? { ...r, status: "dead" } : r));
                    }
                }
                completed++;
                setProgress(Math.round((completed / initialList.length) * 100));
            }));
        }

        stopScan();
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col min-h-[700px] max-h-[700px] transform transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <FaDesktop className="text-primary" />
                    IP Scanner
                </h3>
                {scanning && <span className="text-xs text-primary animate-pulse font-mono font-semibold">Scanning... {progress}%</span>}
            </div>

            {/* Controls */}
            <div className="space-y-4 mb-4 w-full overflow-hidden">
                {/* Subnet / CIDR */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                        Subnet Check (CIDR)
                    </label>

                    <div className="flex gap-2 w-full">
                        <input
                            type="text"
                            value={cidr}
                            onChange={(e) => setCidr(e.target.value)}
                            placeholder="192.168.1.0/24"
                            className="flex-1 min-w-0 p-2.5 rounded-md bg-input border border-border text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                        />

                        <button
                            onClick={() => calculateRange(cidr)}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs font-bold hover:bg-secondary/80 transition-colors shrink-0"
                        >
                            SET RANGE
                        </button>
                    </div>

                    {/* CIDR Quick Buttons */}
                    <div className="flex gap-2 mt-1 px-1">
                        {[16, 24, 26].map(mask => (
                            <button
                                key={mask}
                                onClick={() => {
                                    if (!startIp) return;
                                    try {
                                        const ipParts = startIp.split('.').map(Number);
                                        if (ipParts.length !== 4 || ipParts.some(isNaN)) return;

                                        const binaryIp = ipParts
                                            .map(part => part.toString(2).padStart(8, "0"))
                                            .join("");

                                        const broadcastBinary = binaryIp
                                            .substring(0, mask)
                                            .padEnd(32, "1");

                                        const binToIp = (bin: string) =>
                                            bin.match(/.{8}/g)?.map(b => parseInt(b, 2)).join(".") || "";

                                        const broadcast = binToIp(broadcastBinary);

                                        const endParts = broadcast.split('.').map(Number);
                                        endParts[3]--;
                                        setEndIp(endParts.join('.'));

                                        const networkBinary = binaryIp
                                            .substring(0, mask)
                                            .padEnd(32, "0");

                                        setCidr(`${binToIp(networkBinary)}/${mask}`);
                                    } catch { }
                                }}
                                className="px-2 py-1 bg-muted/60 hover:bg-muted text-[10px] rounded border border-border text-foreground/80 font-mono transition-colors"
                            >
                                /{mask}
                            </button>
                        ))}
                    </div>
                </div>

                {/* IP Range + Scan Button */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground ml-1">
                        IP Range
                    </label>

                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="text"
                            value={startIp}
                            onChange={(e) => setStartIp(e.target.value)}
                            className="flex-1 min-w-0 p-2.5 rounded-md bg-input border border-border text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono text-center"
                        />

                        <span className="text-muted-foreground font-bold shrink-0">-</span>

                        <input
                            type="text"
                            value={endIp}
                            onChange={(e) => setEndIp(e.target.value)}
                            className="flex-1 min-w-0 p-2.5 rounded-md bg-input border border-border text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono text-center"
                        />

                        <button
                            onClick={handleScan}
                            className={`h-[42px] w-[42px] rounded-md text-white font-bold transition-all flex items-center justify-center shadow-sm shrink-0 ${scanning
                                ? "bg-destructive hover:bg-destructive/90"
                                : "bg-primary hover:bg-primary/90"
                                }`}
                            title={scanning ? "Stop Scan" : "Start Scan"}
                        >
                            {scanning ? <FaStop /> : <FaPlay />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className={`mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50 transition-opacity duration-300 ${scanning ? "opacity-100" : "opacity-0"}`}>
                {scanning && (
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                )}
            </div>

            {/* Results Table */}
            <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col bg-background relative">
                <div className="flex bg-muted/50 p-2.5 text-xs font-bold text-muted-foreground border-b border-border shadow-sm">
                    <div className="w-8 text-center">St</div>
                    <div className="w-32">IP Address</div>
                    <div className="w-16 text-right">Ping</div>
                    <div className="flex-1 px-4">Hostname</div>
                    <div className="w-24 text-right">Ports</div>
                </div>

                <div className="overflow-y-auto flex-1 p-0 relative h-[320px]">
                    {results.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                            <FaNetworkWired className="text-4xl opacity-20" />
                            <span className="text-sm font-medium">Ready to scan network</span>
                        </div>
                    )}

                    {results.map((res) => {
                        if (res.status === "dead" || res.status === "pending") return null;

                        return (
                            <div key={res.ip} className="flex items-center p-2 text-xs border-b border-border/40 hover:bg-muted/30 font-mono transition-colors group">
                                <div className="w-8 flex justify-center">
                                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-background ${res.status === "alive" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                                        res.status === "scanning" ? "bg-yellow-500 animate-pulse" : ""
                                        }`} />
                                </div>
                                <div className="w-32 font-semibold text-foreground group-hover:text-primary transition-colors">{res.ip}</div>
                                <div className="w-16 text-right text-foreground/80">{res.ping ? `${res.ping}ms` : ""}</div>
                                <div className="flex-1 px-4 truncate text-muted-foreground">{res.hostname || (res.status === "alive" ? "N/A" : "")}</div>
                                <div className="w-24 text-right text-primary truncate opacity-80">
                                    {res.ports && res.ports.length > 0 ? res.ports.join(', ') : ""}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-2 bg-muted/20 border-t border-border text-[10px] uppercase font-bold text-muted-foreground flex justify-between tracking-wider">
                    <span>Scanned: {results.length}</span>
                    <span className="text-primary">Alive: {results.filter(r => r.status === "alive").length}</span>
                </div>
            </div>
        </div>
    );
};

export default IpScanner;
