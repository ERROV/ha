"use client";

import WhatsAppBotControl from "@/components/WhatsAppBotControl";
import { motion } from "framer-motion";
import { FaRobot, FaCog } from "react-icons/fa";

export default function BotControlPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <header className="mb-8 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <FaRobot className="text-primary text-2xl" />
                                </div>
                                <h1 className="text-4xl font-bold text-foreground">
                                    Bot Control Center
                                </h1>
                            </div>
                            <p className="text-muted-foreground ml-14">Management & monitoring for WhatsApp notification bot</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-2 shadow-sm">
                            <button className="p-2 hover:bg-muted rounded-md transition-colors">
                                <FaCog className="text-muted-foreground text-xl" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </header>

            <div className="max-w-7xl mx-auto">
                <WhatsAppBotControl />
            </div>
        </div>
    );
}
