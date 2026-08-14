"use client";
import React, { useState } from "react";
import { FaExchangeAlt, FaBalanceScale } from "react-icons/fa";

type Mode = "speed" | "power";

const UnitConverter = () => {
    const [mode, setMode] = useState<Mode>("speed");
    const [input, setInput] = useState("");
    const [result, setResult] = useState<string | null>(null);

    const convert = (val: string) => {
        setInput(val);
        const num = parseFloat(val);
        if (isNaN(num)) {
            setResult(null);
            return;
        }

        if (mode === "speed") {
            // Mbps to MB/s
            // 1 Byte = 8 bits
            const mbs = (num / 8).toFixed(2);
            setResult(`${num} Mbps ≈ ${mbs} MB/s`);
        } else {
            // dBm to mW
            // P(mW) = 1mW * 10^(P(dBm)/10)
            const mw = (Math.pow(10, num / 10)).toFixed(4);
            setResult(`${num} dBm ≈ ${mw} mW`);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full transform transition-all duration-300 hover:shadow-xl hover:border-primary/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaBalanceScale className="text-primary" />
                Unit Converter
            </h3>

            <div className="flex bg-muted/50 rounded-lg p-1 mb-4 border border-border">
                <button
                    onClick={() => { setMode("speed"); setInput(""); setResult(null); }}
                    className={`flex-1 py-1 text-sm rounded-md transition-all ${mode === "speed" ? "bg-card shadow text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Speed (Mbps)
                </button>
                <button
                    onClick={() => { setMode("power"); setInput(""); setResult(null); }}
                    className={`flex-1 py-1 text-sm rounded-md transition-all ${mode === "power" ? "bg-card shadow text-primary font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Power (dBm)
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="number"
                        placeholder={mode === "speed" ? "Enter Mbps..." : "Enter dBm..."}
                        className="w-full p-3 rounded-md bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground placeholder-muted-foreground"
                        value={input}
                        onChange={(e) => convert(e.target.value)}
                    />
                    <FaExchangeAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                </div>

                <div className={`p-4 rounded-lg border text-center transition-all ${result ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border"}`}>
                    {result ? (
                        <span className="text-lg font-semibold text-primary">{result}</span>
                    ) : (
                        <span className="text-muted-foreground text-sm">Result will appear here</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitConverter;
