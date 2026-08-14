"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaPhone, FaEnvelope, FaSave, FaSpinner, FaClock } from "react-icons/fa";

const ProfilePage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        phoneNumber: "",
        email: "",
        workHours: "" as "" | "morning" | "evening",
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        if (session?.user) {
            fetchUserData();
        }
    }, [session, status, router]);

    const fetchUserData = async () => {
        try {
            setFetching(true);
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setFormData({
                        name: data.user.name || "",
                        phoneNumber: data.user.phoneNumber || "",
                        email: data.user.email || session?.user?.email || "",
                        workHours: data.user.workHours || "",
                    });
                }
            } else {
                // Fallback to session data if API fails
                setFormData(prev => ({
                    ...prev,
                    name: session?.user?.name || "",
                    email: session?.user?.email || "",
                }));
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
            toast.error("Failed to load profile data");
        } finally {
            setFetching(false);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    phoneNumber: formData.phoneNumber,
                    workHours: formData.workHours || null
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            toast.success("Profile updated successfully!");
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10 flex justify-center transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl"
            >
                <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-primary/10 p-6 border-b border-border flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : <FaUser />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
                            <p className="text-muted-foreground text-sm">Update your personal information</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Email Field (Read-only) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FaEnvelope className="text-muted-foreground" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    className="w-full p-3 rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed focus:outline-none"
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            {/* Name Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FaUser className="text-muted-foreground" />
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            {/* Phone Number Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FaPhone className="text-muted-foreground " />
                                    WhatsApp Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    placeholder="e.g. 9647701234567"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: Country code + Number (e.g., 964...)
                                </p>
                            </div>

                            {/* Work Hours Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <FaClock className="text-muted-foreground" />
                                    Work Hours
                                </label>
                                <select
                                    name="workHours"
                                    value={formData.workHours}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                >
                                    <option value="">Not Set</option>
                                    <option value="morning">Morning (8:30 AM - 8:30 PM)</option>
                                    <option value="evening">Evening (4:30 PM - 12:30 AM)</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Select your preferred work shift
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave />
                                            Save Changes
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
