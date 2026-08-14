"use client";
import { motion } from "framer-motion";
import {
  FaTools,
  FaGamepad,
  FaNetworkWired
} from "react-icons/fa";
import CheckZoneCard from "@/components/ui/CheckZoneCard";
import SubnetCalculator from "@/components/tools/SubnetCalculator";
import UnitConverter from "@/components/tools/UnitConverter";
import PortChecker from "@/components/tools/PortChecker";
import TracerouteVisualizer from "@/components/gaming/TracerouteVisualizer";
import NatFixer from "@/components/gaming/NatFixer";
import IpScanner from "@/components/tools/IpScanner";
import JitterMonitor from "@/components/gaming/JitterMonitor";
import ServerStatus from "@/components/gaming/ServerStatus";
import IpLocation from "@/components/ui/IpLocation";

const SupportTeamPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      {/* <header className="relative z-10 p-6 border-b border-border backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-wide text-primary">
            Support Team Resources
          </h1>
          <p className="text-muted-foreground mt-2">
            Technical guides, configuration tools, and activation resources
          </p>
        </motion.div>
      </header> */}

      <main className="relative z-10 flex flex-col flex-1 p-6 gap-8 max-w-7xl mx-auto no-scrollbar">

        {/* Network Utilities Section */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2"
          >
            <FaTools className="text-primary" />
            Network Utilities
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SubnetCalculator />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <UnitConverter />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <PortChecker />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="h-full">
              <CheckZoneCard />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <IpLocation />
            </motion.div>
          </div>
        </section>

        <hr className="border-border opacity-50" />

        {/* Gaming Diagnostics Hub */}
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2"
          >
            <FaGamepad className="text-primary" />
            Gaming Diagnostics Hub
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Row 1: Key Realtime Tools */}
            <motion.div className="md:col-span-2 xl:col-span-2 min-h-[300px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <TracerouteVisualizer />
            </motion.div>
            <motion.div className="min-h-[300px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <ServerStatus />
            </motion.div>

            {/* Row 2: Fixers & Monitors */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <NatFixer />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <JitterMonitor />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <IpScanner />
            </motion.div>
          </div>
        </section>

      </main>
    </div >
  );
};

export default SupportTeamPage;