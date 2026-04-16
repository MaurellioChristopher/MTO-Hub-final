import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke portal MTO-Hub",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ── Animated Mesh Background ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Primary gradient orb — Crimson */}
        <div
          className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, #DC143C 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        {/* Secondary gradient orb — Gold */}
        <div
          className="absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: "rgba(17, 17, 24, 0.80)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: `
              0 32px 80px rgba(0,0,0,0.6),
              0 0 0 1px rgba(220,20,60,0.08),
              inset 0 1px 0 rgba(255,255,255,0.07)
            `,
          }}
        >
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            {/* MTO Logo mark */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white p-1 shadow-xl"
              style={{
                boxShadow: "0 8px 24px rgba(220,20,60,0.4), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <img
                src="/mto-logo.png"
                alt="MTO Logo"
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Selamat Datang di{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #D4AF37 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                MTO-Hub
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Managerial Trainer Organization · Portal Internal
            </p>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(220,20,60,0.4))" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-[#DC143C] opacity-60" />
              <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(220,20,60,0.4), transparent)" }} />
            </div>
          </div>

          {/* Form */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Bottom tagline */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Managerial Trainer Organization 25/26 Internal Website
        </p>
      </div>
    </main>
  );
}
