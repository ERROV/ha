"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Clock,
  ArrowLeftRight,
  MapPinned,
  Crown,
  Loader2,
} from "lucide-react";

import { TimeSlotsManagementSection } from "@/components/TimeSlotsManagementSection";
import SingleTimesConfigSection from "@/components/SingleTimesConfigSection";
import PopupDialog from "@/components/ui/PopupDialog";
import AdminShiftSwaps from "@/components/Shift/AdminShiftSwaps";
import AdminNeighborhoodCard from "@/components/AdminNeighborhoodCard";
import QueueStatus from "@/components/QueueStatus";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const { data: timeslots, mutate: mutateTimeslots } = useSWR("/api/timeslots", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date().toLocaleTimeString()),
  });

  const { data: lunchformData, mutate: mutateLunchform } = useSWR("/api/lunchformVisibility", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
  });

  const toggleLunchformVisibility = async () => {
    if (!lunchformData) return;
    const newVisibility = !lunchformData.visible;
    try {
      const res = await fetch("/api/lunchformVisibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: newVisibility }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      mutateLunchform();
      toast.success(`Lunchform is now ${newVisibility ? "Visible" : "Hidden"}`);
    } catch {
      toast.error("Failed to update lunchform visibility");
    }
  };

  const [popup, setPopup] = useState<{ action: () => void; title: string; description?: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    const user = session?.user as { id: string; role: string } | undefined;

    if (user?.role !== "admin") {
      toast.error("Access denied: Admins only");
      setError("You are not authorized to access the admin dashboard.");
      router.push("/protected/employee");
    }
  }, [session, status, router]);

  const confirmAction = (title: string, description: string, action: () => void) => {
    setPopup({ title, description, action });
  };

  const handleDeleteReservation = (id: string) => {
    confirmAction("Delete Reservation", "Are you sure you want to delete this reservation?", async () => {
      try {
        const res = await fetch(`/api/reservationsAdmin/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete reservation");
        mutateTimeslots();
        toast.success("Reservation deleted");
      } catch {
        toast.error("Error deleting reservation");
      }
    });
  };

  const ClearAllTimeslots = () => {
    confirmAction("Clear All Time Slots", "Are you sure you want to delete all time slots?", async () => {
      try {
        const res = await fetch(`/api/timeslotsadmin`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to clear time slots");
        mutateTimeslots();
        toast.success("Time slots cleared");
      } catch {
        toast.error("Error clearing time slots");
      }
    });
  };

  if (status === "loading" || !timeslots) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-10 h-10 text-primary" />
          <span className="text-muted-foreground text-sm font-medium">Loading Dashboard Client Interface...</span>
        </div>
      </div>
    );
  }

  if (error) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 transition-colors duration-300">
      {/* Exquisite Header */}
      <header className="mb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Centralized real-time operational control and settings management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-muted/40 border border-border/50 rounded-lg px-3.5 py-2 self-stretch md:self-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs text-muted-foreground font-semibold">Last Synced:</span>
            </div>
            <span className="font-mono text-xs font-bold text-foreground bg-background px-2 py-1 rounded border border-border">
              {lastUpdated}
            </span>
          </div>
        </motion.div>
      </header>

      {/* Single Employee Capacity Config */}
      <div className="max-w-7xl mx-auto mb-6">
        <SingleTimesConfigSection />
      </div>

      {/* Time Slots Management */}
      <div className="max-w-7xl mx-auto mb-6">
        <TimeSlotsManagementSection
          timeslots={timeslots}
          onDelete={handleDeleteReservation}
          onClearAll={ClearAllTimeslots}
          lunchformVisible={lunchformData?.visible || false}
          toggleLunchformVisibility={toggleLunchformVisibility}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Queue Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <QueueStatus />
        </motion.section>

        {/* Shift Swaps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1 bg-card rounded-xl shadow-lg p-6 border border-border"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-primary/10 rounded-lg mr-4">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Shift Swap Management</h2>
              <p className="text-muted-foreground text-sm">Review employee swap applications</p>
            </div>
          </div>

          <AdminShiftSwaps />
        </motion.section>

        {/* Neighborhood Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 xl:col-span-1 bg-card rounded-xl shadow-lg p-6 border border-border"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-lg mr-4">
              <MapPinned className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Neighborhood Data</h2>
              <p className="text-muted-foreground text-sm">Manage dynamic regional info</p>
            </div>
          </div>

          <AdminNeighborhoodCard />
        </motion.section>
      </div>

      {/* Popup Dialog */}
      {popup && (
        <PopupDialog
          open={!!popup}
          onOpenChange={(open) => !open && setPopup(null)}
          title={popup.title}
          description={popup.description}
          onConfirm={() => {
            popup.action();
            setPopup(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;