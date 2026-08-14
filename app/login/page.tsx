"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const NextLoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const { data: session, status: sessionStatus } = useSession();

  // ✅ always outside any condition
/*   useEffect(() => {
    
    if (sessionStatus === "authenticated") {
      router.push("/protected/employee");
    }
  }, [sessionStatus, router]); */

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements[0] as HTMLInputElement).value;
    const password = (form.elements[1] as HTMLInputElement).value;

    if (!isValidEmail(email)) {
      setError("Email is invalid");
      toast.error("Email is invalid");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password is invalid");
      toast.error("Password is invalid");
      return;
    }

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      toast.error("Invalid email or password");
    } else {
      setError("");
      toast.success("Successful login");
      router.replace("/protected/employee");
    }
  };

  // ✅ render conditionally after hooks
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full">
      {/* Background & Overlay */}
      <div
        className="fixed inset-0 z-[-10] bg-cover bg-center"
        style={{ backgroundImage: 'url("/login.png")' }}
      />
      <div className="fixed inset-0 z-[-10] bg-black opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-1 flex-col justify-center py-12 px-6 sm:px-12 max-w-md w-full bg-white bg-opacity-90 rounded-lg m-auto shadow-lg"
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-md border border-gray-300 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-md border border-gray-300 py-1.5 text-gray-900 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-900">
              <input type="checkbox" className="h-4 w-4 text-black mr-2" />
              Remember me
            </label>
            <Link href="#" className="text-sm text-black hover:text-gray-900">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white border border-black hover:bg-white hover:text-black transition-colors py-1.5 rounded-md text-sm"
          >
            Sign in
          </button>
        </form>

        {error && <p className="text-red-600 text-center text-sm mt-4">{error}</p>}
      </motion.div>
    </div>
  );
};

export default NextLoginPage;
