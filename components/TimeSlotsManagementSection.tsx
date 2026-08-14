"use client";

import { motion } from "framer-motion";
import { Clock, Eye, EyeOff, Trash2 } from "lucide-react";
import TimeCard from "@/components/ui/TimeCard";
import { Button } from "@/components/ui/button";

export const TimeSlotsManagementSection = ({
  timeslots,
  onDelete,
  onClearAll,
  lunchformVisible,
  toggleLunchformVisibility,
}: {
  timeslots: any[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  lunchformVisible: boolean;
  toggleLunchformVisibility: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-card rounded-xl shadow-lg p-6 border border-border mb-8"
  >
    <div className="flex items-center mb-6">
      <div className="p-3 bg-primary/10 rounded-lg mr-4">
        <Clock className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Time Slots Management</h2>
        <p className="text-muted-foreground text-sm">Manage employee reservations and slots</p>
      </div>
    </div>

    <TimeCard timeslots={timeslots} onDelete={onDelete} />

    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button
        variant="destructive"
        className="shadow-md"
        onClick={onClearAll}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        <span>Clear All Time Slots</span>
      </Button>

      <Button
        variant="outline"
        onClick={toggleLunchformVisibility}
        className="shadow-sm hover:shadow-md transition-all"
      >
        {lunchformVisible ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            <span>Hide Lunchform</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            <span>Show Lunchform</span>
          </>
        )}
      </Button>
    </div>
  </motion.section>
);
