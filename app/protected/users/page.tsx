"use client";

import useSWR from "swr";
import { toast } from "react-hot-toast";
import { useState } from "react";
import UserCardHorizontal from "@/components/ui/userCard";
import PopupDialog from "@/components/ui/PopupDialog";
import AlertsList from "@/components/AlertsList";
import {
  Users as UsersIcon,
  Bell,
  Trash2,
  Send,
  UserCog,
  Loader2,
  Save,
  Check,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Users() {
  type UserType = {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    team?: string;
    password?: string;
    status: string;
    avatar?: string;
    phoneNumber?: string;
    workHours?: "morning" | "evening" | null;
  };

  const { data: users, mutate: mutateUsers } = useSWR<UserType[]>("/api/users", fetcher, {
    refreshInterval: 1000,
    dedupingInterval: 0,
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const { data: alerts, mutate: mutateAlerts } = useSWR("/api/alerts", fetcher);

  const [popupDelete, setPopupDelete] = useState<{ id: string; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserType | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<UserType>>({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [popupAlertOpen, setPopupAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertBody, setAlertBody] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const session = useSession();

  const handleOpenEdit = (user: UserType) => {
    setUserToEdit(user);
    setEditedUser({
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || "",
      workHours: user.workHours || null,
    });
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveUser = async () => {
    if (!userToEdit) return;

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Password confirmation does not match");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {};
      if (typeof editedUser.name !== "undefined") payload.name = editedUser.name?.trim();
      if (typeof editedUser.email !== "undefined") payload.email = editedUser.email?.trim();
      if (typeof editedUser.role !== "undefined") payload.role = editedUser.role;
      if (typeof editedUser.phoneNumber !== "undefined") payload.phoneNumber = editedUser.phoneNumber?.trim() || null;
      if (typeof editedUser.workHours !== "undefined") payload.workHours = editedUser.workHours || null;
      if (newPassword) payload.password = newPassword;

      const res = await fetch(`/api/users/${userToEdit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to update user";
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            msg = data?.message || data?.error || msg;
          } catch {
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      toast.success("User updated successfully");
      await mutateUsers();
      setUserToEdit(null);
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewUser = (user: UserType) => {
    toast.success(`Viewing account: ${user.name}`);
  };

  const handleDeleteUser = (id: string) => {
    const user = users?.find((u) => u._id === id);
    if (!user) return;
    setPopupDelete({ id, name: user.name });
  };

  const confirmDelete = async () => {
    if (!popupDelete) return;
    try {
      const res = await fetch(`/api/users/${popupDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Failed to delete user";
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            msg = data?.message || data?.error || msg;
          } catch {
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }
      toast.success("User deleted successfully");
      mutateUsers();
    } catch (e: any) {
      toast.error(e.message || "Error deleting user");
    } finally {
      setPopupDelete(null);
    }
  };

  const sendAlert = async () => {
    if (!alertTitle.trim() || !alertBody.trim()) {
      toast.error("Please fill in the title and content");
      return;
    }

    const payload: any = {
      title: alertTitle.trim(),
      body: alertBody.trim(),
      createdAt: new Date().toISOString(),
      createdBy: session.data?.user?.name,
    };

    try {
      let res: Response;

      if (sendToAll) {
        res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (selectedUserId) {
        payload.userId = selectedUserId;
        res = await fetch("/api/notifications/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        toast.error("Please select a user or choose 'Send to All'");
        return;
      }

      if (!res.ok) {
        let msg = "Failed to send alert";
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            msg = data?.message || data?.error || msg;
          } catch {
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      toast.success("Alert sent successfully via real-time notification");
      setAlertTitle("");
      setAlertBody("");
      setSendToAll(true);
      setSelectedUserId(null);
      setSearchTerm("");
      setPopupAlertOpen(false);
      mutateAlerts();
    } catch (err: any) {
      toast.error(err.message || "Failed to send alert");
    }
  };

  if (!users) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary text-sm font-semibold">
          <Loader2 className="animate-spin w-5 h-5" />
          <span>Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 text-foreground transition-colors duration-300">
      {/* Header Banner */}
      <header className="relative z-10 mb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              System Accounts
            </h1>
          </div>

          {/* Send Alert Button with custom sleek UI */}
          <Button
            size="lg"
            onClick={() => setPopupAlertOpen(true)}
            className="font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Bell className="w-4 h-4 mr-2" />
            <span>Send Alert</span>
          </Button>
        </motion.div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-lg border border-border flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2.5 text-foreground tracking-tight">
                <UsersIcon className="w-5 h-5 text-primary" />
                <span>Accounts ({users.length})</span>
              </h2>
            </div>

            {/* Search */}
            <div className="mb-5 relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-input border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
              />
            </div>

            <div className="overflow-y-auto max-h-[600px] pr-1">
              <UserCardHorizontal
                users={users?.filter((u) =>
                  u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onDelete={handleDeleteUser}
                onEdit={handleOpenEdit}
                onView={handleViewUser}
              />
            </div>
          </motion.section>

          {/* Recent Alerts */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-6 shadow-lg border border-border flex flex-col"
          >
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2.5 text-foreground tracking-tight">
              <Bell className="w-5 h-5 text-primary" />
              <span>Recent Alerts</span>
            </h2>

            {!alerts || alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground my-auto">
                <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30 stroke-1" />
                <p className="text-xs">No alerts dispatched yet</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                <AlertsList />
              </div>
            )}
          </motion.section>
        </div>
      </main>

      {/* Delete User Popup */}
      {popupDelete && (
        <PopupDialog
          open={!!popupDelete}
          onOpenChange={(open) => !open && setPopupDelete(null)}
          title={
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </div>
          }
          description={`Are you sure you want to permanently delete account "${popupDelete.name}"? All associated reservation entries will also be purged.`}
          onConfirm={confirmDelete}
          confirmLabel={
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Confirm Delete</span>
            </div>
          }
        />
      )}

      {/* Edit User Popup */}
      {userToEdit && (
        <PopupDialog
          open={!!userToEdit}
          onOpenChange={(open) => !open && setUserToEdit(null)}
          title={
            <div className="flex items-center gap-2 text-foreground font-bold">
              <UserCog className="w-5 h-5 text-primary" />
              <span>Edit Account Details</span>
            </div>
          }
          onConfirm={handleSaveUser}
          confirmLabel={
            <div className="flex items-center gap-2 font-bold">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </div>
          }
          isConfirmDisabled={isSaving}
        >
          <div className="space-y-3.5 text-left pt-2">
            <div>
              <label htmlFor="edit-name" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={editedUser.name ?? ""}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="edit-email"
                type="email"
                value={editedUser.email ?? ""}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="edit-role" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Account Privilege Role
              </label>
              <select
                id="edit-role"
                value={editedUser.role ?? "user"}
                onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as UserType["role"] })}
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-password" className="block text-xs font-bold text-muted-foreground mb-1.5">
                New Password (Optional)
              </label>
              <input
                id="edit-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to retain original key"
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="edit-password-confirm" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Confirm New Password
              </label>
              <input
                id="edit-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="edit-phone" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Contact Phone
              </label>
              <input
                id="edit-phone"
                type="text"
                value={editedUser.phoneNumber ?? ""}
                onChange={(e) => setEditedUser({ ...editedUser, phoneNumber: e.target.value })}
                placeholder="e.g. 9647701234567"
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="edit-workhours" className="block text-xs font-bold text-muted-foreground mb-1.5">
                Work Schedule Assignment
              </label>
              <select
                id="edit-workhours"
                value={editedUser.workHours ?? ""}
                onChange={(e) => setEditedUser({ ...editedUser, workHours: (e.target.value || null) as "morning" | "evening" | null })}
                className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Not Allocated</option>
                <option value="morning">Morning Shift (8:30 AM - 8:30 PM)</option>
                <option value="evening">Evening Shift (4:30 PM - 12:30 AM)</option>
              </select>
            </div>
          </div>
        </PopupDialog>
      )}

      {/* Send Alert Popup */}
      <PopupDialog
        open={popupAlertOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPopupAlertOpen(false);
            setAlertTitle("");
            setAlertBody("");
            setSendToAll(true);
            setSelectedUserId(null);
            setSearchTerm("");
          }
        }}
        title={
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Send className="w-5 h-5 text-primary" />
            <span>Dispatch System Broadcast</span>
          </div>
        }
        onConfirm={sendAlert}
        confirmLabel={
          <div className="flex items-center gap-2 font-bold">
            <Send className="w-4 h-4" />
            <span>Broadcast Alert</span>
          </div>
        }
      >
        <div className="space-y-4 text-left pt-2">
          <div>
            <label htmlFor="alertTitle" className="block text-xs font-bold text-muted-foreground mb-1.5">
              Alert Subject Header
            </label>
            <input
              id="alertTitle"
              type="text"
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
              placeholder="e.g. Critical Update / Notice"
              className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="alertBody" className="block text-xs font-bold text-muted-foreground mb-1.5">
              Broadcast Statement
            </label>
            <textarea
              id="alertBody"
              rows={4}
              value={alertBody}
              onChange={(e) => setAlertBody(e.target.value)}
              placeholder="Provide exact operational payload here..."
              className="w-full rounded-lg bg-input border border-border py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Send To Option */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={sendToAll}
                onChange={() => setSendToAll(true)}
                className="accent-primary"
              />
              <span className="text-xs font-bold text-foreground">Target Entire Network</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!sendToAll}
                onChange={() => setSendToAll(false)}
                className="accent-primary"
              />
              <span className="text-xs font-bold text-foreground">Target Specific Account</span>
            </label>
          </div>

          {/* User Selection */}
          {!sendToAll && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Lookup account by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="max-h-44 overflow-y-auto border border-border rounded-lg bg-background divide-y divide-border">
                {users
                  ?.filter((u) =>
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user._id}
                      onClick={() => setSelectedUserId(user._id)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/60 transition-colors ${
                        selectedUserId === user._id ? "bg-primary/10 text-primary font-bold" : ""
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                      {selectedUserId === user._id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                  ))}
                {users?.filter((u) =>
                  u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-muted-foreground text-xs py-3">No matching accounts identified</p>
                )}
              </div>
            </div>
          )}
        </div>
      </PopupDialog>
    </div>
  );
}
