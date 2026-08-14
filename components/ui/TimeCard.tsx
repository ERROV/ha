"use client";
import React from "react";
import { Clock3, Trash2, User2 } from "lucide-react";
import { motion } from "framer-motion";

type Timeslot = {
  time: string;
  bookings: {
    _id: string;
    user: {
      name: string;
    };
  }[];
};

type Props = {
  timeslots: Timeslot[];
  onDelete: (id: string) => void;
};

export default function TimeCard({ timeslots, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
      {timeslots.map((slot, index) => (
        <motion.div
          key={slot.time}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-muted/30 p-5 rounded-xl shadow-md border border-border hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock3 className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">{slot.time}</span>
          </div>

          {slot.bookings.length > 0 ? (
            <ul className="space-y-3">
              {slot.bookings.map((booking) => (
                <motion.li
                  key={booking._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between bg-card rounded-lg p-3 border border-border hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground font-medium">{booking.user.name}</span>
                  </div>
                  <button
                    onClick={() => onDelete(booking._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
              <p className="text-sm">No bookings</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}