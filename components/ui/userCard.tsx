"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  User,
  Users,
  Bell,
  BellOff,
  Info,
} from "lucide-react";
import { Button } from "./button";

const statusColorMap: Record<string, string> = {
  active: "bg-green-500/10 border-green-500/20 text-green-500",
  paused: "bg-red-500/10 border-red-500/20 text-red-500",
  vacation: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  inactive: "bg-muted border-border text-muted-foreground",
};

type UserType = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  password?: string;
  team?: string;
  status: string;
  avatar?: string;
  pushSubscription?: any;
};

type Props = {
  users: UserType[];
  onDelete?: (id: string) => void;
  onEdit?: (user: UserType) => void;
  onView?: (user: UserType) => void;
};

export default function UserCardHorizontal({ users, onDelete, onEdit, onView }: Props) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case "manager":
        return <Users className="w-4 h-4 text-emerald-500" />;
      default:
        return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-lg border border-border max-w-6xl mx-auto transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {users.map((user) => (
          <motion.div
            key={user._id}
            whileHover={{ scale: 1.005 }}
            className="bg-muted/30 p-4 rounded-xl shadow-sm border border-border hover:border-primary/50 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            {/* User Profile info */}
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden shadow-inner">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-extrabold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full border border-border shadow-sm">
                  {getRoleIcon(user.role)}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground line-clamp-1">{user.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground line-clamp-1">{user.email}</span>
                  {user.pushSubscription ? (
                    <span title="Notifications active" className="flex items-center">
                      <Bell className="w-3 h-3 text-emerald-500 shrink-0" />
                    </span>
                  ) : (
                    <span title="Notifications inactive" className="flex items-center">
                      <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Role & Team */}
            <div className="flex flex-col sm:items-center sm:mx-4 shrink-0">
              <div className="flex items-center gap-1.5">
                {getRoleIcon(user.role)}
                <span className="capitalize text-xs font-bold text-foreground">{user.role}</span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {user.team || "No team assigned"}
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold capitalize tracking-wide shrink-0 ${
                  statusColorMap[user.status] || "bg-muted border-border text-muted-foreground"
                }`}
              >
                {user.status || "active"}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => onView?.(user)}
                  aria-label="View details"
                >
                  <Eye className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                  onClick={() => onEdit?.(user)}
                  aria-label="Edit user"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDelete?.(user._id)}
                  aria-label="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
