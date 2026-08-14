"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ThemeInitializer from "@/components/ThemeInitializer"; // ✅ استدعاء المكون

export default function ProtectedLayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const handleComplete = () => {
      setLoading(false);
    };

    if (document.readyState === "complete") {
      handleComplete();
    } else {
      window.addEventListener("load", handleComplete);
    }

    return () => {
      window.removeEventListener("load", handleComplete);
    };
  }, [pathname]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ThemeInitializer /> {/* ✅ تطبيق الوضع الداكن */}
      {children}
    </>
  );
}
