"use client";

import { useEffect } from "react";

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => {
         
        })
        .catch((err) => {
          console.error("Firebase Service Worker registration failed:", err);
        });
    }
  }, []);

  return <>{children}</>;
}
