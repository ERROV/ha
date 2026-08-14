"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { ArrowLeftRight, User, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminShiftSwaps() {
  const { data: swaps, isLoading, error } = useSWR("/api/shifts/swap/admin", fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-xs font-semibold">
        <Loader2 className="animate-spin w-4 h-4 mr-2 text-primary" />
        <span>Loading swap applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-xs font-semibold">
        Failed to fetch exchange registry
      </div>
    );
  }

  if (!swaps || swaps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
        <p className="text-xs">No active shift swaps logged</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pr-1 max-h-80 overflow-y-auto">
      {swaps.map((swap: any) => (
        <motion.div
          key={swap._id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/30 p-3.5 rounded-xl border border-border hover:border-primary/50 transition-all flex flex-col gap-2.5 text-xs"
        >
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {/* Offered by */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-background rounded-lg border border-border shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground line-clamp-1">
                  {swap.offeredBy?.name ?? "Unknown"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize font-medium">
                  Offered: {swap.offeredShiftType}
                </p>
              </div>
            </div>

            <ArrowLeftRight className="w-4 h-4 text-emerald-500 shrink-0 mx-1" />

            {/* Taken by */}
            <div className="flex items-center gap-2 text-right justify-end">
              <div>
                <p className="font-bold text-foreground line-clamp-1">
                  {swap.takenBy?.name ?? "Unknown"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize font-medium">
                  Took: {swap.takenShiftType}
                </p>
              </div>
              <div className="p-1.5 bg-background rounded-lg border border-border shrink-0">
                <User className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3 text-primary shrink-0" />
            <span className="font-mono">
              {new Date(swap.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}