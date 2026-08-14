// hooks/usePageLoader.ts
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function usePageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300); // simulate load
    return () => clearTimeout(timer);
  }, [pathname]);

  return loading;
}
