// components/LunchForm.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Clock3, User2, Utensils } from "lucide-react";

interface User {
  name: string;
}

interface Booking {
  _id: string;
  user: User;
}

interface TimeSlot {
  time: string;
  bookings: Booking[];
  maxBookings?: number;
}

interface LunchFormProps {
  timeslots?: TimeSlot[];
  onBookingSuccess?: () => void;
}

const EVENING_TIMES = [
  "6:30", "7:00", "7:30",
  "8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
];
const MORNING_TIMES = ["10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30"];

// Helpers
function getBaghdadTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 60 * 60 * 1000); // UTC+3
}

function isBetween(start: string, end: string, now: Date): boolean {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (startMin > endMin) {
    // فترة تتجاوز منتصف الليل
    return nowMin >= startMin || nowMin < endMin;
  } else {
    return nowMin >= startMin && nowMin < endMin;
  }
}

export default function LunchForm({ timeslots: initialTimeslots, onBookingSuccess }: LunchFormProps) {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>(initialTimeslots || []);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBooking, setUserBooking] = useState<{ timeSlot: string } | null>(null);
  const [isLoading, setIsLoading] = useState(!initialTimeslots);

  const fetchReservations = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/reservations");

      if (res.ok) {
        const data = await res.json();
        setTimeslots(data);
      } else {
        toast.error("Failed to load reservations");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBooking = async (): Promise<void> => {
    try {
      const userRes = await fetch("/api/user-reservation");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserBooking(userData.booking);
        if (userData.booking) {
          setSelectedTime(userData.booking.timeSlot);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user booking:", err);
    }
  };

  useEffect(() => {
    if (!initialTimeslots) {
      fetchReservations();
    }
    fetchUserBooking();
  }, [initialTimeslots]);

  const handleSelect = async (time: string): Promise<void> => {
    if (userBooking) {
      toast.error("You already have a booking");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSlot: time }),
      });

      if (res.ok) {
        setSelectedTime(time);
        toast.success(`Successfully booked ${time}`);
        await Promise.all([fetchReservations(), fetchUserBooking()]);
        if (onBookingSuccess) onBookingSuccess();
      } else {
        const error = await res.text();
        toast.error(error || "Something went wrong while booking.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = getBaghdadTime();
  const showMorning = isBetween("08:30", "16:30", now);
  const showEvening = isBetween("16:30", "00:30", now);
  const availableTimes = showMorning ? MORNING_TIMES : showEvening ? EVENING_TIMES : [];

  if (isLoading) {
    return (
      <div className="p-6 bg-card rounded-2xl max-w-6xl mx-auto border border-border shadow-xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading available time slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-2xl max-w-6xl mx-auto border border-border shadow-xl transition-colors duration-300">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="bg-primary p-3 rounded-full">
          <Utensils className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-primary">
          Lunch Time Booking
        </h2>
      </div>

      {userBooking && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-600 dark:text-green-400 text-center">
            You have already booked a slot at <strong>{userBooking.timeSlot}</strong>
          </p>
        </div>
      )}

      {availableTimes.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Booking is only available between 8:30 AM and 12:30 AM (Baghdad time).
        </p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {availableTimes.map((time) => {
            const slot = timeslots.find((t) => t.time === time);
            const bookings = slot?.bookings || [];

            const maxBookings = slot?.maxBookings ?? 2;
            const isFull = bookings.length >= maxBookings;
            const isUserBooked = userBooking && userBooking.timeSlot === time;
            const isDisabled = isFull || !!userBooking || isSubmitting;

            return (
              <motion.div
                key={time}
                className={`p-4 rounded-xl border shadow-md flex flex-col justify-between transition-colors ${isFull
                  ? "bg-red-500/10 border-red-500/30"
                  : isUserBooked
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-card border-border hover:border-primary/50"
                  }`}
                whileHover={!isDisabled ? { scale: 1.03 } : {}}
                whileTap={!isDisabled ? { scale: 0.97 } : {}}
              >
                <div className="flex items-center gap-2 mb-3 text-lg font-medium text-foreground">
                  <div className={`p-2 rounded-lg ${isFull ? "bg-red-500/20" : isUserBooked ? "bg-green-500/20" : "bg-primary/20"
                    }`}>
                    <Clock3 className={isFull ? "text-red-500" : isUserBooked ? "text-green-500" : "text-primary"} />
                  </div>
                  <span>{time}</span>
                  <span className="text-sm ml-auto text-muted-foreground">
                    ({bookings.length}/{maxBookings})
                  </span>
                </div>

                {bookings.length > 0 ? (
                  <ul className="space-y-2 text-sm text-foreground mb-3">
                    {bookings.map((b) => (
                      <li key={b._id} className="flex items-center gap-2">
                        <div className="bg-primary/20 p-1 rounded-full">
                          <User2 className="text-xs text-primary" />
                        </div>
                        {b.user.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">No bookings yet</p>
                )}

                <button
                  onClick={() => handleSelect(time)}
                  disabled={isDisabled}
                  className={`mt-auto w-full py-2.5 text-sm font-semibold rounded-lg transition-all ${isDisabled
                    ? "bg-muted cursor-not-allowed text-muted-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                >
                  {isUserBooked
                    ? "Your Booking"
                    : isFull
                      ? "Fully Booked"
                      : "Book Now"}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}