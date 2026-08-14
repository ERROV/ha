"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { FaCalendarDay, FaMoon, FaSun, FaClock } from "react-icons/fa";

export default function AddShiftForm() {
  const [type, setType] = useState("evening");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/shifts/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, date }),
    });

    if (res.ok) {
      toast.success("✅ Shift offered successfully");
      setDate("");
    } else {
      toast.error("❌ Failed to offer shift");
    }
  };

  const getShiftIcon = () => {
    switch (type) {
      case "morning": return <FaSun className="text-yellow-400" />;
      case "evening": return <FaSun className="text-orange-400" />;
      case "night": return <FaMoon className="text-blue-400" />;
      case "over": return <FaClock className="text-purple-400" />;
      default: return <FaCalendarDay className="text-gray-400" />;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card p-6 rounded-xl shadow-lg border border-border flex flex-col md:flex-row gap-6 items-end transition-colors duration-300"
    >
      <div className="flex-1 w-full">
        <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
          Date
        </label>
        <div className="relative">
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-lg bg-background px-4 py-2.5 text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 w-full">
        <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
          Shift Type
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 text-muted-foreground">
            {getShiftIcon()}
          </div>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg bg-background px-4 py-2.5 pl-10 text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
          >
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="over">Over</option>
          </select>
          <div className="absolute right-3 text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 whitespace-nowrap"
      >
        Offer Shift
      </Button>
    </form>
  );
}