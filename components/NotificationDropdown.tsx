"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Bell, BellDot, Check } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  data?: { userId?: string | null };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const { data, mutate } = useSWR(
    session ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 30000 } // Reduced polling since SSE is active
  );

  const notifications: NotificationItem[] = data?.notifications?.map((n: any) => ({
    id: n._id,
    title: n.title,
    body: n.body,
    time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: n.read,
    data: { ...n.data, userId: n.userId || null }
  })) || [];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (res.ok) mutate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      if (res.ok) mutate();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
      <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-accent/50 transition-colors no-scrollbar focus:outline-none focus:ring-2 focus:ring-primary">
        <AnimatePresence>
          {unreadCount > 0 ? (
            <motion.div key="bell-dot" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <BellDot className="w-5 h-5 text-primary no-scrollbar" />
            </motion.div>
          ) : (
            <motion.div key="bell" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <Bell className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        {unreadCount > 0 && (
          <motion.span
            className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center no-scrollbar"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-xl no-scrollbar" align="end">
        <DropdownMenuLabel className="flex justify-between items-center px-4 py-3 bg-muted rounded-t-xl no-scrollbar">
          <span className="text-foreground font-bold">Notifications</span>
          {unreadCount > 0 && (
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 no-scrollbar" onClick={markAllAsRead}>
              <Check className="w-3 h-3" />
              Mark all as read
            </button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border no-scrollbar" />

        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground no-scrollbar">
            <Bell className="mx-auto w-8 h-8 mb-2 opacity-50 no-scrollbar" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border no-scrollbar">
            {notifications.slice(0, 10).map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={`p-4 cursor-pointer hover:bg-muted focus:bg-muted ${!item.read ? 'bg-muted/40' : ''}`}
                onClick={() => markAsRead(item.id)}
              >
                <div className="flex gap-3 w-full">
                  <div className={`w-2 rounded-full flex-shrink-0 ${!item.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{item.body}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                      {!item.read && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          New
                        </span>
                      )}
                      {item.data?.userId == null && (
                        <span className="text-xs px-1 py-0.5 rounded-full bg-secondary text-secondary-foreground ml-2">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 10 && (
          <div className="text-center py-3 text-xs text-muted-foreground border-t border-border">
            Showing 10 of {notifications.length} notifications
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
