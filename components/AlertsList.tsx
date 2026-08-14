"use client";
export const dynamic = "force-dynamic";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Bell, Trash2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

// Extend the session user type to include 'role'
declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AlertsList() {
  const { data: alerts, mutate } = useSWR("/api/alerts", fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
  });

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  if (!alerts) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-xs font-semibold">
        <Loader2 className="animate-spin w-4 h-4 mr-2 text-primary" />
        <span>Loading dispatches...</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground my-auto">
        <Bell className="w-8 h-8 mx-auto mb-2.5 opacity-20 stroke-1" />
        <p className="text-xs">No dispatches triggered yet</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const confirmed = await new Promise((resolve) => {
      toast.custom((t) => (
        <div className={`bg-card p-4 rounded-xl shadow-2xl border border-border max-w-sm w-full ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xs font-bold text-foreground">Purge Broadcast</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Are you sure you want to completely erase this logged alert?</p>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { toast.dismiss(t.id); resolve(false); }}
                  className="h-6 px-2.5 text-[10px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { toast.dismiss(t.id); resolve(true); }}
                  className="h-6 px-2.5 text-[10px] font-bold"
                >
                  Erase
                </Button>
              </div>
            </div>
          </div>
        </div>
      ), { duration: Infinity });
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete alert");

      toast.success("Broadcast purged from records");
      mutate();
    } catch (error) {
      toast.error("Failed to eliminate broadcast entry");
    }
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map((alert: any) => (
          <motion.div
            key={alert._id}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            layout
            className="p-4 rounded-xl shadow-sm border border-border bg-muted/20 hover:bg-muted/40 transition-all duration-200 text-left relative overflow-hidden group"
          >
            {/* Left Accent indicator border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 rounded-l" />

            <div className="flex justify-between items-start gap-3 pl-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-3.5 h-3.5 text-primary shrink-0" />
                  <h3 className="font-bold text-xs text-foreground line-clamp-1">{alert.title}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground pl-5 leading-relaxed whitespace-pre-wrap break-words">
                  {alert.body}
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 pl-5 text-[10px] text-muted-foreground/80 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(alert.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(alert._id)}
                  className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete broadcast"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}