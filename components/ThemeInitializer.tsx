"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    // فعّل الوضع الداكن دائمًا
    document.documentElement.classList.add();

    // ✅ يمكنك بدلًا من ذلك تفعيل الوضع حسب تفضيلات النظام:
    // const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  return null; // هذا المكون لا يعرض شيء
}
