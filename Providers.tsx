"use client";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";

import React from "react";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "17px",
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
};

export default Providers;
