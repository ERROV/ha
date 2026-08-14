"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaWhatsapp,
    FaQrcode,
    FaSync,
    FaCircle,
    FaRobot,
    FaHistory,
    FaExclamationCircle,
    FaCheckCircle,
    FaArrowRight,
    FaUsers,
    FaPaperPlane,
    FaSearch,
    FaInbox,
    FaClock,
    FaTerminal
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

// Detect server URL dynamically
const getSocketUrl = () => {
    // 1. Check if an explicit BOT_URL is provided via environment
    if (process.env.NEXT_PUBLIC_BOT_URL) {
        return process.env.NEXT_PUBLIC_BOT_URL;
    }

    if (typeof window === 'undefined') return "http://localhost:3001";

    // 2. Logic to detect current hostname and append port 3001 as fallback
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname !== 'localhost' && !hostname.startsWith('192.168.')) {
        return `${protocol}//${hostname}:3001`;
    }
    return "http://localhost:3001";
};

const SOCKET_URL = getSocketUrl();

export default function WhatsAppBotControl() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Disconnected");
    const [logs, setLogs] = useState<any[]>([]);
    const [terminalLogs, setTerminalLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [dbLogs, setDbLogs] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("control");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [customMsg, setCustomMsg] = useState("");
    const [isSending, setIsSending] = useState(false);

    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
            timeout: 10000
        });
        setSocket(newSocket);

        newSocket.on("connect", () => {
            setStatus("Socket Connected");
        });

        newSocket.on("whatsapp:qr", ({ qr }) => {
            setQrCode(qr);
            setStatus("Awaiting Scan");
        });

        newSocket.on("whatsapp:status", (newStatus) => {
            setStatus(newStatus);
            if (newStatus === "Connected" || newStatus === "Authenticated") {
                setQrCode(null);
            }
        });

        newSocket.on("whatsapp:log", (log) => {
            setLogs((prev) => [log, ...prev].slice(0, 50));
            fetchHistory();
        });

        newSocket.on("bot:terminal", (log) => {
            setTerminalLogs((prev) => [...prev, log].slice(-100));
        });

        newSocket.on("bot:terminal_history", (history) => {
            console.log(`Received ${history.length} lines of terminal history.`);
            setTerminalLogs(history);
        });

        fetchUsers();
        fetchHistory();

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'terminal' && terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [terminalLogs, activeTab]);

    const fetchUsers = async () => {
        try {
            console.log("Fetching users from:", `${SOCKET_URL}/api/users`);
            const res = await fetch(`${SOCKET_URL}/api/users`);
            const data = await res.json();
            console.log("Fetch Users Response:", data);
            if (data.success) {
                setUsers(data.users);
            } else {
                console.warn("Fetch users succeeded but success flag was false:", data);
            }
        } catch (e) {
            console.error("Failed to fetch users from API:", e);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${SOCKET_URL}/api/logs`);
            const data = await res.json();
            if (data.success) setDbLogs(data.logs);
        } catch (e) {
            console.error("Failed to fetch logs");
        }
    };

    const handleManualTrigger = async (shiftType: string) => {
        try {
            const res = await fetch(`${SOCKET_URL}/api/notify/manual`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shiftType })
            });
            const data = await res.json();
            if (data.success) toast.success(`Manual override sent!`);
            else toast.error(data.error || "Failed to send");
        } catch (err) {
            toast.error("Connection error");
        }
    };

    const sendCustomMessage = async () => {
        if (!selectedUser || !customMsg) return;
        setIsSending(true);
        try {
            const res = await fetch(`${SOCKET_URL}/api/notify/custom`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: selectedUser.phoneNumber,
                    userId: selectedUser._id,
                    userName: selectedUser.name,
                    message: customMsg
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Message sent via active channels!");
                setCustomMsg("");
                setSelectedUser(null);
                fetchHistory();
            } else {
                toast.error("Failed to send");
            }
        } catch (e) {
            toast.error("Server error");
        } finally {
            setIsSending(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "Connected":
            case "Authenticated": return "text-emerald-500 bg-emerald-500/10";
            case "Awaiting Scan": return "text-amber-500 bg-amber-500/10";
            case "Disconnected": return "text-rose-500 bg-rose-500/10";
            default: return "text-blue-500 bg-blue-500/10";
        }
    };

    const getChannelStatusIcon = (status: string, type: 'whatsapp' | 'webpush') => {
        if (status === 'sent') return <FaCheckCircle className="text-emerald-500" size={10} title={`${type} Sent`} />;
        if (status === 'failed') return <FaExclamationCircle className="text-rose-500" size={10} title={`${type} Failed`} />;
        return <FaCircle className="text-muted-foreground/30" size={10} title={`${type} N/A`} />;
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phoneNumber?.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit overflow-x-auto max-w-full">
                {[
                    { id: "control", icon: FaRobot, label: "Bot Center" },
                    { id: "users", icon: FaUsers, label: "User Directory" },
                    { id: "history", icon: FaClock, label: "Message History" },
                    { id: "terminal", icon: FaTerminal, label: "Live Terminal" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-background/50"}`}
                    >
                        <tab.icon size={14} />
                        <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "control" && (
                    <motion.div
                        key="control"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Status Card */}
                            <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <FaRobot className="text-2xl text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Bot Status</h2>
                                        <p className="text-muted-foreground text-sm">Real-time connection</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className={`flex items-center justify-between p-4 rounded-xl border border-border ${getStatusColor()}`}>
                                        <div className="flex items-center gap-3">
                                            <FaCircle className={`text-xs animate-pulse`} />
                                            <span className="font-bold">{status}</span>
                                        </div>
                                        <FaSync className="cursor-pointer hover:rotate-180 transition-all duration-500" onClick={() => socket?.emit('bot:reconnect')} />
                                    </div>
                                    <div className="p-4 bg-muted/30 rounded-xl border border-border text-xs">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted-foreground">Server URL:</span>
                                            <span className="font-medium break-all">{SOCKET_URL}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Section */}
                            <div className="lg:col-span-2 bg-card rounded-2xl shadow-xl p-6 border border-border flex flex-col items-center justify-center text-center min-h-[300px]">
                                {qrCode ? (
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block border-8 border-primary/10">
                                            <QRCodeSVG value={qrCode} size={200} level="H" />
                                        </div>
                                        <p className="font-medium flex items-center justify-center gap-2">
                                            <FaWhatsapp className="text-emerald-500" />
                                            Scan with your WhatsApp device
                                        </p>
                                    </div>
                                ) : (status === "Connected" || status === "Authenticated") ? (
                                    <div className="space-y-4">
                                        <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                            <FaCheckCircle className="text-6xl text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold">Bot is Active</h3>
                                        <p className="text-muted-foreground">Authenticated and ready</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-pulse">
                                        <FaSync className="text-4xl text-primary mx-auto animate-spin" />
                                        <p className="text-muted-foreground">Waiting for WhatsApp service...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Manual Controls */}
                        <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FaExclamationCircle className="text-amber-500" />
                                Quick Manual Reminders
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={() => handleManualTrigger('2-9')} className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary transition-all text-left">
                                    <div className="font-bold flex items-center justify-between">Shift 2-9 <FaArrowRight size={12} /></div>
                                    <span className="text-xs text-muted-foreground">شفت فجر (2:00 AM)</span>
                                </button>
                                <button onClick={() => handleManualTrigger('7:30-2:30')} className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary transition-all text-left">
                                    <div className="font-bold flex items-center justify-between">Shift 7:30-2:30 <FaArrowRight size={12} /></div>
                                    <span className="text-xs text-muted-foreground">شفت مساء (7:30 PM)</span>
                                </button>
                                <button onClick={() => handleManualTrigger('4-11')} className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary transition-all text-left">
                                    <div className="font-bold flex items-center justify-between">Shift 4-11 <FaArrowRight size={12} /></div>
                                    <span className="text-xs text-muted-foreground">شفت ظهر (4:00 PM)</span>
                                </button>
                                <button onClick={() => handleManualTrigger('11-6')} className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary transition-all text-left">
                                    <div className="font-bold flex items-center justify-between">Shift 11-6 <FaArrowRight size={12} /></div>
                                    <span className="text-xs text-muted-foreground">شفت صباح (11:00 AM)</span>
                                </button>
                                <button onClick={() => handleManualTrigger('9-4')} className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary transition-all text-left">
                                    <div className="font-bold flex items-center justify-between">Shift 9-4 <FaArrowRight size={12} /></div>
                                    <span className="text-xs text-muted-foreground">شفت صباحي (9:00 AM)</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "users" && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">User Directory</h2>
                                    <p className="text-sm text-muted-foreground">Manage and message employees</p>
                                </div>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search name or number..."
                                        className="pl-10 pr-4 py-2 bg-muted/50 rounded-xl border border-transparent focus:border-primary w-full md:w-64 outline-none text-sm transition-all"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-muted-foreground">
                                            <th className="pb-3 font-medium">Name</th>
                                            <th className="pb-3 font-medium">Phone Number</th>
                                            <th className="pb-3 font-medium">Shift</th>
                                            <th className="pb-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUsers.map(user => (
                                            <tr key={user._id} className="group hover:bg-muted/30 transition-colors">
                                                <td className="py-4 font-medium">{user.name}</td>
                                                <td className="py-4 text-muted-foreground">{user.phoneNumber}</td>
                                                <td className="py-4 capitalize">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.workHours === 'morning' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                                        {user.workHours || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all inline-flex items-center gap-2"
                                                    >
                                                        <FaPaperPlane size={12} />
                                                        <span className="text-xs">Message</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-20 text-muted-foreground">
                                        <FaInbox className="mx-auto text-4xl mb-4 opacity-10" />
                                        <p>No users found matching your search</p>
                                        <button onClick={fetchUsers} className="mt-4 text-primary text-xs hover:underline flex items-center gap-1 mx-auto">
                                            <FaSync size={10} /> Retry Loading Users
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "history" && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-card rounded-2xl shadow-xl p-6 border border-border"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Message History</h2>
                                <p className="text-sm text-muted-foreground">Database logs</p>
                            </div>
                            <button onClick={fetchHistory} className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-primary">
                                <FaSync size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {dbLogs.map((log, i) => (
                                <div key={log._id || i} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/10">
                                    <div className={`p-3 rounded-lg ${log.type === 'custom' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                        <FaWhatsapp size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-foreground">
                                                {log.userName}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                                    <div className="flex items-center gap-1">
                                                        <FaWhatsapp size={10} className="text-muted-foreground" />
                                                        {getChannelStatusIcon(log.whatsappStatus, 'whatsapp')}
                                                    </div>
                                                    <div className="w-[1px] h-3 bg-border mx-0.5" />
                                                    <div className="flex items-center gap-1">
                                                        <FaRobot size={10} className="text-muted-foreground" />
                                                        {getChannelStatusIcon(log.webpushStatus, 'webpush')}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{log.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === "terminal" && (
                    <motion.div
                        key="terminal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-[#0c0c0c] rounded-2xl shadow-2xl p-6 border border-[#222] font-mono text-sm min-h-[500px] flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4 border-b border-[#222] pb-4">
                            <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                <FaTerminal />
                                <span>Bot Server Terminal</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 max-h-[500px]">
                            {terminalLogs.map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <span className="text-muted-foreground/30 select-none min-w-[70px]">{log.time}</span>
                                    <span className={log.type === 'error' ? 'text-rose-500' : 'text-emerald-500/80 group-hover:text-emerald-400'}>
                                        <span className="mr-2 opacity-50">{log.type === 'error' ? '✖' : '➜'}</span>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Message Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border relative z-10"
                        >
                            <div className="p-6 bg-primary text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <FaWhatsapp size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Message {selectedUser.name}</h3>
                                        <p className="text-xs text-white/70">{selectedUser.phoneNumber}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <textarea
                                    className="w-full bg-muted/50 border border-border rounded-2xl p-4 text-sm outline-none focus:border-primary transition-all min-h-[150px]"
                                    placeholder="Type your personalized message here..."
                                    value={customMsg}
                                    onChange={(e) => setCustomMsg(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedUser(null)} className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold border border-border hover:bg-muted transition-all">Cancel</button>
                                    <button onClick={sendCustomMessage} disabled={isSending || !customMsg} className="flex-1 bg-primary text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                                        {isSending ? <FaSync className="animate-spin" /> : <FaPaperPlane />}
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
