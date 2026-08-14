"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import Lunchform from "@/components/ui/lunchform";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmployeeSchedule() {
  const { data: timeslots, error: timeslotsError, mutate: mutateTimeslots } = useSWR("/api/timeslots", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const { data: lunchformData, error: lunchformError } = useSWR("/api/lunchformVisibility", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
  });

  if (timeslotsError || lunchformError) {
    toast.error("Error loading data");
    return <Skeleton />;
  }

  if (!timeslots || !lunchformData) return <Skeleton />;

  if (!lunchformData.visible) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Lunchform is currently hidden by the administrator.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4"></h1>
      <Lunchform timeslots={timeslots} onBookingSuccess={() => mutateTimeslots()} />
    </div>
  );
}
