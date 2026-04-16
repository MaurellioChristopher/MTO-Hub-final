"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { Preloader } from "@/components/ui/preloader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Preloader />
      {children}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#16161F",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F0F0F5",
          },
        }}
      />
    </SessionProvider>
  );
}
