"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaUserPlus, FaEnvelope, FaLock, FaUserTag, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();


  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) return;
    const user = session?.user as { id: string; role: string } | undefined;

    if (user?.role !== "admin") {
      toast.error("Access denied: Admins only");
      setError("You are not authorized to access the admin dashboard.");
      router.push("/protected/employee");
    }
  }, [session, sessionStatus, router]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();



    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmpassword.value;
    const name = form.name.value;
    const role = form.role.value;

    if (!isValidEmail(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (confirmPassword !== password) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    if (!name || name.length < 3) {
      setError("Name must be at least 3 characters");
      toast.error("Name must be at least 3 characters");
      return;
    }

    if (!role || (role !== "user" && role !== "admin")) {
      setError("Role is invalid");
      toast.error("Role is invalid");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
        }),
      });

      if (res.status === 400) {
        toast.error("This email is already registered");
        setError("Email already in use");
      }
      if (res.status === 200) {
        setError("");
        toast.success("Registration successful");
        router.push("/protected/dashboard");
      }
    } catch (error) {
      toast.error("Error, please try again");
      setError("Error, please try again");
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    sessionStatus === "authenticated" && (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden p-6 transition-colors duration-300">
        {/* Header */}
        <header className="relative z-10 p-6 border-b border-border backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-wide text-foreground">
              Employee Registration
            </h1>
            <p className="text-muted-foreground mt-2">
              Register new employees for the system
            </p>
          </motion.div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center flex-1 p-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-card rounded-2xl shadow-xl p-8 border border-border"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 block w-full rounded-lg bg-background border border-input py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="employee@example.com"
                  />
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-muted-foreground" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-10 block w-full rounded-lg bg-background border border-input py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Role Field */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTag className="text-muted-foreground" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    required
                    className="pl-10 block w-full rounded-lg bg-background border border-input py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10 block w-full rounded-lg bg-background border border-input py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmpassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-muted-foreground" />
                  </div>
                  <input
                    id="confirmpassword"
                    name="confirmpassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10 block w-full rounded-lg bg-background border border-input py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <FaUserPlus />
                Register Employee
              </motion.button>
            </form>
          </motion.div>
        </main>

        <footer className="mt-12 text-center text-sm text-muted-foreground border-t border-border pt-6 pb-4">
          <p>Employee Registration System • Admin Dashboard</p>
          <p className="mt-2">Designed with the same theme</p>
        </footer>
      </div>
    )
  );
};

export default RegisterPage;