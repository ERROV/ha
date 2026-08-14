"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import PopupDialog from "@/components/ui/PopupDialog";
import { FaCalendarAlt, FaClock, FaUser, FaExchangeAlt, FaTrash, FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ShiftList() {
  const { data: session, status } = useSession();
  const { data: shifts, isLoading, error, mutate } = useSWR("/api/shifts/", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const [shiftToDelete, setShiftToDelete] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [myShiftType, setMyShiftType] = useState("night");

  useEffect(() => {
    if (error) toast.error("❌ Failed to load shifts");
  }, [error]);

  const handleSwap = async () => {
    const res = await fetch("/api/shifts/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: selectedOffer._id,
        takenShiftType: myShiftType,
      }),
    });

    if (res.ok) {
      toast.success("✅ Shift swapped successfully");
      setSelectedOffer(null);
      await mutate();
    } else {
      toast.error("❌ Failed to swap shift");
    }
  };

  const handleDelete = async () => {
    if (!shiftToDelete) return;

    const res = await fetch(`/api/shifts/${shiftToDelete._id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("🗑️ Shift deleted");
      setShiftToDelete(null);
      mutate();
    } else {
      toast.error("❌ Failed to delete shift");
    }
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case "morning": return <FaSun className="text-yellow-400" />;
      case "evening": return <FaSun className="text-orange-400" />;
      case "night": return <FaMoon className="text-blue-400" />;
      case "over": return <FaClock className="text-purple-400" />;
      default: return <FaClock className="text-gray-400" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <FaClock className="animate-spin mr-2" />
        Loading shifts...
      </div>
    );
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FaCalendarAlt className="mx-auto text-4xl mb-3 opacity-50" />
        <p>No available shifts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-3 text-primary">
        <FaCalendarAlt />
        Available Shifts
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift: any) => {
          const isMine = String((session?.user as { id?: string })?.id) === String(shift.userId?._id);

          return (
            <motion.div
              key={shift._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-6 rounded-xl shadow-lg border border-border transition-colors duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getShiftIcon(shift.type)}
                  <h3 className="font-medium capitalize text-foreground">{shift.type} Shift</h3>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FaCalendarAlt className="text-primary" />
                  <span>{new Date(shift.date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FaUser className="text-primary" />
                  <span>{shift.userId?.name || "Unknown"}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {!isMine && (
                  <button
                    onClick={() => setSelectedOffer(shift)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm"
                  >
                    <FaExchangeAlt />
                    Swap
                  </button>
                )}

                {isMine && (
                  <button
                    onClick={() => setShiftToDelete(shift)}
                    className="flex-1 flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg transition-all shadow-sm"
                  >
                    <FaTrash />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Swap Confirmation Dialog */}
      <PopupDialog
        title={
          <div className="flex items-center gap-2 text-foreground">
            <FaExchangeAlt className="text-green-500" />
            Confirm Shift Swap
          </div>
        }
        open={!!selectedOffer}
        onOpenChange={(open) => {
          if (!open) setSelectedOffer(null);
        }}
        onConfirm={handleSwap}

      >
        {selectedOffer && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg border border-border">
              <p className="font-medium text-foreground">Offered Shift:</p>
              <div className="flex items-center gap-3 mt-2">
                {getShiftIcon(selectedOffer.type)}
                <span className="capitalize text-foreground">{selectedOffer.type} Shift</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <FaCalendarAlt className="text-primary" />
                <span>{new Date(selectedOffer.date).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your current shift type:
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  {getShiftIcon(myShiftType)}
                </div>
                <select
                  value={myShiftType}
                  onChange={(e) => setMyShiftType(e.target.value)}
                  className="w-full rounded-lg bg-background px-4 py-2.5 pl-10 text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                  <option value="over">Over</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </PopupDialog>

      {/* Delete Confirmation Dialog */}
      <PopupDialog
        title={
          <div className="flex items-center gap-2 text-foreground">
            <FaTrash className="text-destructive" />
            Confirm Delete Shift
          </div>
        }
        open={!!shiftToDelete}
        onOpenChange={(open) => {
          if (!open) setShiftToDelete(null);
        }}
        onConfirm={handleDelete}

      >
        {shiftToDelete && (
          <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="mb-3 text-foreground">Are you sure you want to delete this shift?</p>
            <div className="flex items-center gap-3">
              {getShiftIcon(shiftToDelete.type)}
              <span className="capitalize text-foreground">{shiftToDelete.type} Shift</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <FaCalendarAlt className="text-primary" />
              <span>{new Date(shiftToDelete.date).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </PopupDialog>
    </div>
  );
}