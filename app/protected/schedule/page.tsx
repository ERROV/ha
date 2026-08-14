"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import AddShiftForm from "@/components/Shift/AddShiftForm";
import ShiftList from "@/components/Shift/ShiftList";
import { FaCalendarAlt, FaChartLine, FaTimes } from "react-icons/fa";

export default function MonthlySchedulePage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);

  const scheduleRef = useRef<HTMLDivElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showScheduleModal &&
        scheduleRef.current &&
        !scheduleRef.current.contains(event.target as Node)
      ) {
        setShowScheduleModal(false);
      }
      if (
        showQualityModal &&
        qualityRef.current &&
        !qualityRef.current.contains(event.target as Node)
      ) {
        setShowQualityModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showScheduleModal, showQualityModal]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
      <div className="flex justify-center gap-6 mb-8">
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg"
        >
          <FaCalendarAlt />
          Show Schedule
        </button>
        <button
          onClick={() => setShowQualityModal(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg"
        >
          <FaChartLine />
          Show Quality
        </button>
      </div>

      <div className="space-y-10 max-w-6xl mx-auto">
        <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-500">
            <FaCalendarAlt />
            Add New Shift
          </h2>
          <AddShiftForm />
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-orange-500">
            <FaChartLine />
            Manage Shifts
          </h2>
          <ShiftList />
        </div>
      </div>

      {/* Modals */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            ref={scheduleRef}
            className="relative w-[90vw] h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden border border-border"
          >
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
              aria-label="Close Schedule Modal"
            >
              <FaTimes />
            </button>
            <iframe
              src="https://docs.google.com/spreadsheets/d/1WbiVZ-7DfOR0gbQMHziIOD9dyRifc_y6NlCaE5oY9eo/edit?gid=1696074804#gid=1696074804"
              className="w-full h-full"
              allowFullScreen
              title="Monthly Schedule"
            />
          </div>
        </div>
      )}

      {showQualityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            ref={qualityRef}
            className="relative w-[90vw] h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden border border-border"
          >
            <button
              onClick={() => setShowQualityModal(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
              aria-label="Close Quality Modal"
            >
              <FaTimes />
            </button>
            <iframe
              src="https://docs.google.com/spreadsheets/d/1YNLsc9Z8FG6ceb0HvitzIQFPCPFWhiLkyEF0l5A6nZ4/edit?gid=1147850475#gid=1147850475"
              className="w-full h-full"
              allowFullScreen
              title="Employee Quality"
            />
          </div>
        </div>
      )}
    </div>
  );
}