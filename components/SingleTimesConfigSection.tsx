"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Settings2, Save, User, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const MORNING_TIMES = ["10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30"];
const EVENING_TIMES = [
  "6:30", "7:00", "7:30",
  "8:00", "8:30", "9:00", "9:30",
  "10:00", "10:30", "11:00", "11:30",
];

export default function SingleTimesConfigSection() {
  const [singleTimes, setSingleTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSingleTimes(data.singleEmployeeTimes || []);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleTime = (time: string) => {
    setSingleTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ singleEmployeeTimes: singleTimes }),
      });

      if (res.ok) {
        toast.success("Capacity settings updated successfully!");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (err) {
      toast.error("Network error while saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-xl shadow-lg p-6 border border-border mb-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Settings2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Single / Normal Capacity Configuration</h2>
            <p className="text-muted-foreground text-sm">
              Select timeslots to limit to 1 employee (Single). Unselected slots allow 2 employees.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md transition-all self-end sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Morning Times */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 border-b border-border pb-2">
              Morning Times
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {MORNING_TIMES.map((time) => {
                const configKey = `morning_${time}`;
                const isSingle = singleTimes.includes(configKey);
                return (
                  <motion.button
                    key={time}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTime(configKey)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      isSingle
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "bg-muted/30 border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {isSingle ? <User className="w-4 h-4" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                    <span>{time}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isSingle ? "bg-amber-500/20" : "bg-muted text-muted-foreground"}`}>
                      {isSingle ? "1 Emp" : "2 Emps"}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Evening Times */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 border-b border-border pb-2">
              Evening Times
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {EVENING_TIMES.map((time) => {
                const configKey = `evening_${time}`;
                const isSingle = singleTimes.includes(configKey);
                return (
                  <motion.button
                    key={time}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTime(configKey)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      isSingle
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "bg-muted/30 border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {isSingle ? <User className="w-4 h-4" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                    <span>{time}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isSingle ? "bg-amber-500/20" : "bg-muted text-muted-foreground"}`}>
                      {isSingle ? "1 Emp" : "2 Emps"}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
