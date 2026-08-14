"use client";
import React, { useState } from "react";
import { FaGamepad, FaCopy, FaCheck } from "react-icons/fa";
// Removed FaWhatsapp import

const NatFixer = () => {
    const [copied, setCopied] = useState(false);

    const natTemplate = `
NAT Type Optimization:
1. Assign Static IP to Console/PC.
2. Open Ports:
   - TCP: 80, 443, 3478-3480
   - UDP: 3478-3479, 49152-65535
3. Enable DMZ for Console IP (if ports fail).
4. Check UPnP is ENABLED.
    `.trim();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(natTemplate);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <FaGamepad className="text-primary" />
                NAT Type Force Fix
            </h3>

            <div className="flex-1 bg-muted/30 p-4 rounded-md font-mono text-sm text-muted-foreground whitespace-pre-wrap mb-4 border border-border overflow-y-auto max-h-[200px]">
                {natTemplate}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-md hover:opacity-90 flex items-center justify-center gap-2 transition font-medium"
                >
                    {copied ? <FaCheck /> : <FaCopy />}
                    {copied ? "Copied to Clipboard" : "Copy Template"}
                </button>
            </div>
        </div>
    );
};

export default NatFixer;
