"use client";
export const dynamic = "force-dynamic";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaHourglassEnd,
  FaCoffee,
  FaHistory,
  FaBell,

} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import AlertsList from "@/components/AlertsList";
import QueueStatus from "@/components/QueueStatus";

const fetcher = (url: string) => fetch(url).then((res) => res.json());



export default function BreakRequestPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id: string })?.id;
  const { data, mutate } = useSWR("/api/breaks", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
  });

  const [countdown, setCountdown] = useState<number | null>(null);

  const userBreaks = data?.filter((r: any) => r.userId === userId) || [];

  const approved = userBreaks.find(
    (r: any) =>
      r.status === "approved" &&
      r.expiresAt &&
      new Date(r.expiresAt) > new Date()
  );

  const approvedNotStarted = userBreaks.find(
    (r: any) => r.status === "approved" && !r.expiresAt
  );

  const pending = userBreaks.find((r: any) => r.status === "pending");

  const today = new Date().toDateString();

  const usedCount =
    userBreaks.filter(
      (r: any) =>
        r.status === "approved" &&
        r.expiresAt &&
        new Date(r.requestedAt).toDateString() === today &&
        new Date(r.expiresAt) < new Date()
    ).length || 0;

  const remaining = 3 - usedCount;

  useEffect(() => {
    if (!approved?.expiresAt) {
      setCountdown(null);
      return;
    }

    const expires = new Date(approved.expiresAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setCountdown(diff);

      if (diff <= 0) {
        toast("⏰ Break is over!");
        clearInterval(interval);
        mutate();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [approved, mutate]);

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  const requestBreak = async () => {
    if (pending || approved || approvedNotStarted) {
      return toast.error("You already have a pending or active break.");
    }
    if (remaining <= 0) {
      return toast.error("You reached the maximum of 3 breaks today.");
    }
    try {
      const res = await fetch("/api/breaks", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Break request sent.");
      mutate();
    } catch (err) {
      toast.error((err as Error).message || "Failed to request break.");
    }
  };

  const startBreak = async (id: string) => {
    try {
      const res = await fetch(`/api/breaks/start/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Break started.");
      mutate();
    } catch (err) {
      toast.error((err as Error).message || "Failed to start break.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 lg:p-10 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        {/* <header className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold mb-4 text-foreground"
          >
            Break Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Request breaks, track your status, and manage your time efficiently
          </motion.p>
        </header> */}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Break Request Card and Queue Status */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-card rounded-2xl shadow-xl p-6 border border-border transition-colors duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <FaCoffee className="text-2xl text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Request a Break</h2>
                    <p className="text-muted-foreground text-sm">Take a 10-minute break to recharge</p>
                  </div>
                </div>

                <div className="mb-6 bg-muted/50 rounded-xl p-4 border border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Breaks used today:</span>
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-foreground">{usedCount}</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span className="text-xl text-muted-foreground">3</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${(usedCount / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  onClick={requestBreak}
                  disabled={pending || approved || approvedNotStarted || remaining <= 0}
                  className={`w-full py-6 rounded-xl transition-all text-lg font-semibold ${pending || approved || approvedNotStarted || remaining <= 0
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    } flex items-center justify-center gap-3 shadow-md`}
                >
                  {pending ? (
                    <>
                      <FaClock /> Waiting for approval...
                    </>
                  ) : approved ? (
                    <>
                      <FaHourglassEnd />
                      Break in progress {countdown !== null && `(${formatTime(countdown)})`}
                    </>
                  ) : approvedNotStarted ? (
                    <>
                      ✅ Approved – waiting to start
                    </>
                  ) : remaining <= 0 ? (
                    <>
                      ❌ Break limit reached
                    </>
                  ) : (
                    <>
                      <FaCoffee /> Request Break
                    </>
                  )}
                </Button>

                {approvedNotStarted && (
                  <Button
                    onClick={() => startBreak(approvedNotStarted._id)}
                    className="mt-4 w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-md"
                  >
                    ✅ Start Break Now
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <QueueStatus />
            </motion.div>
          </div>

          {/* Right Column: Break History and Alerts */}
          <div className="space-y-6">
            {/* Break History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="bg-card rounded-2xl shadow-xl p-6 border border-border transition-colors duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-amber-500/10 p-3 rounded-full mr-4">
                    <FaHistory className="text-2xl text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Break History</h2>
                    <p className="text-muted-foreground text-sm">Your recent break requests</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {userBreaks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No break requests made yet.</p>
                    </div>
                  ) : (
                    userBreaks.map((r: any) => {
                      const isExpired = r.expiresAt && new Date(r.expiresAt) < new Date();
                      const statusIcon =
                        r.status === "approved" ? (
                          <FaCheckCircle className="text-green-500" />
                        ) : r.status === "rejected" ? (
                          <FaTimesCircle className="text-destructive" />
                        ) : (
                          <FaClock className="text-amber-500" />
                        );
                      const statusColor =
                        r.status === "approved"
                          ? "text-green-500"
                          : r.status === "rejected"
                            ? "text-destructive"
                            : "text-amber-500";

                      return (
                        <motion.div
                          key={r._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{r.userName || "You"}</span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {new Date(r.requestedAt).toLocaleString()}
                            </span>
                            {r.startedAt && (
                              <span className="text-xs text-blue-500 mt-1">
                                Started at {new Date(r.startedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-2 ${statusColor}`}>
                              {statusIcon}
                              <span className="font-medium capitalize">{r.status}</span>
                            </div>
                            {r.expiresAt && (
                              <span className="text-xs text-muted-foreground">
                                ⏰ Ends at {new Date(r.expiresAt).toLocaleTimeString()}
                                {isExpired && " (Expired)"}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>

            {/* Alerts List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="bg-card rounded-2xl shadow-xl p-6 border border-border transition-colors duration-300">
                <div className="flex items-center mb-6">
                  <div className="bg-teal-500/10 p-3 rounded-full mr-4">
                    <FaBell className="text-2xl text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Important Alerts</h2>
                    <p className="text-muted-foreground text-sm">Stay informed with updates</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  <AlertsList />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}

      </motion.div>
    </div>
  );
}