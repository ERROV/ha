"use client";
import React, { useState, useEffect } from "react";
import { FaHeartbeat, FaWaveSquare } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const JitterMonitor = () => {
    const [data, setData] = useState<{ time: string; ping: number }[]>([]);
    const [jitter, setJitter] = useState(0);

    useEffect(() => {
        // Simulate live data
        const interval = setInterval(() => {
            setData(prev => {
                const now = new Date();
                const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                // Simulate jittery ping between 20ms and 80ms
                const newPing = Math.floor(Math.random() * (60) + 20);
                const newData = [...prev, { time, ping: newPing }];
                if (newData.length > 20) newData.shift(); // Keep last 20 points

                // Calculate jitter (avg deviation)
                if (newData.length > 1) {
                    let totalDev = 0;
                    for (let i = 1; i < newData.length; i++) {
                        totalDev += Math.abs(newData[i].ping - newData[i - 1].ping);
                    }
                    setJitter(Math.round(totalDev / (newData.length - 1)));
                }

                return newData;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-card p-6 rounded-xl shadow-md border border-border flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <FaWaveSquare className="text-primary" />
                    Live Jitter Monitor
                </h3>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${jitter < 10 ? "text-green-500" : jitter < 30 ? "text-yellow-500" : "text-destructive"}`}>
                        {jitter}ms
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Jitter</div>
                </div>
            </div>

            <div className="h-[200px] w-full text-foreground">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        {/* 
               IMPORTANT: YAxis needs domain to handle dynamic range nicely.
               XAxis needs dataKey.
             */}
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="ping"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 flex justify-between text-xs text-muted-foreground px-2">
                <span>History (60s)</span>
                <span>Latest: {data[data.length - 1]?.ping}ms</span>
            </div>
        </div>
    );
};

export default JitterMonitor;
