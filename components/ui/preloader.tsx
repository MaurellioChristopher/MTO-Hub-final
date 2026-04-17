"use client";

import { useEffect, useState } from "react";

export function Preloader() {
  const [phase, setPhase]       = useState<"loading" | "done" | "hidden">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [12, 30, 50, 68, 82, 93, 100];
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        setProgress(steps[i++]);
        setTimeout(tick, i === steps.length ? 50 : 30);
      } else {
        setTimeout(() => setPhase("done"),   20);
        setTimeout(() => setPhase("hidden"), 270);
      }
    };
    setTimeout(tick, 20);
  }, []);

  if (phase === "hidden") return null;

  return (
    <>
      <style>{`
        @keyframes pl-spin  { to { transform: rotate(360deg); } }
        @keyframes pl-rspin { to { transform: rotate(-360deg); } }
        @keyframes pl-pulse {
          0%,100% { transform: scale(0.94); opacity: .55; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
        @keyframes pl-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes pl-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pl-ring-pulse {
          0%,100% { opacity: .25; transform: scale(1); }
          50%      { opacity: .7;  transform: scale(1.04); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(139,0,0,0.22) 0%, transparent 60%)," +
            "radial-gradient(ellipse at 70% 80%, rgba(212,175,55,0.09) 0%, transparent 60%)," +
            "#07070D",
          opacity: phase === "done" ? 0 : 1,
          transition: "opacity 0.25s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: phase === "done" ? "none" : "all",
          userSelect: "none",
        }}
      >
        {/* ── Orbital system — truly centered ── */}
        <div
          style={{
            position: "relative",
            width: 280,
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {/* Ring 3 — outermost pulse */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 270, height: 270,
            marginTop: -135, marginLeft: -135,
            borderRadius: "50%",
            border: "1px solid rgba(220,20,60,0.15)",
            animation: "pl-ring-pulse 3s ease-in-out infinite",
          }} />

          {/* Ring 2 — gold counter-rotate with orbiting dots */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 224, height: 224,
            marginTop: -112, marginLeft: -112,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.22)",
            animation: "pl-rspin 3s linear infinite",
          }}>
            {/* Gold dot — top */}
            <div style={{
              position: "absolute",
              top: -5, left: "calc(50% - 5px)",
              width: 10, height: 10,
              borderRadius: "50%",
              background: "#D4AF37",
              boxShadow: "0 0 16px #D4AF37AA",
            }} />
            {/* Red dot — bottom */}
            <div style={{
              position: "absolute",
              bottom: -4, left: "calc(50% - 4px)",
              width: 8, height: 8,
              borderRadius: "50%",
              background: "#DC143C",
              boxShadow: "0 0 12px #DC143CAA",
            }} />
          </div>

          {/* Ring 1 — inner crimson spinner */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 184, height: 184,
            marginTop: -92, marginLeft: -92,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTop: "2px solid rgba(220,20,60,0.9)",
            borderRight: "2px solid rgba(220,20,60,0.3)",
            animation: "pl-spin 1.1s linear infinite",
          }} />

          {/* ── Logo: img tag biasa (next/image strip) ── */}
          <div style={{
            position: "relative",
            zIndex: 2,
            animation: "pl-float 2.8s ease-in-out infinite",
            filter: "drop-shadow(0 0 20px rgba(220,20,60,0.6)) drop-shadow(0 0 50px rgba(220,20,60,0.25))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mto-logo.png"
              alt="MTO Logo"
              width={150}
              height={150}
              style={{
                borderRadius: "50%",
                display: "block",
              }}
            />
          </div>

          {/* Glow behind logo */}
          <div style={{
            position: "absolute",
            width: 170, height: 170,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,20,60,0.2) 0%, transparent 70%)",
            animation: "pl-pulse 1.9s ease-in-out infinite",
            zIndex: 1,
          }} />
        </div>

        {/* ── Text ── */}
        <div style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          animation: "pl-fadein 0.9s ease both",
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "0.18em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #DC143C 45%, #D4AF37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            MTO-HUB
          </h1>
          <p style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: "rgba(255,255,255,0.3)",
          }}>
            Portal Internal MTO 25/26
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 210, height: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 99,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #8B0000, #DC143C, #D4AF37)",
              boxShadow: "0 0 10px rgba(220,20,60,0.7)",
              borderRadius: 99,
              transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <p style={{
            margin: 0,
            fontSize: 10,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.28)",
          }}>
            {progress < 100 ? `Memuat... ${progress}%` : "✓ Siap"}
          </p>
        </div>
      </div>
    </>
  );
}
