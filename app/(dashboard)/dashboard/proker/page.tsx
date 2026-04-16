"use client";

import { useState, useMemo } from "react";
import { CalendarDays, Filter } from "lucide-react";
import {
  PROKER_DATA,
  CATEGORY_CONFIG,
  MONTH_LABELS,
  type ProkerCategory,
} from "@/lib/proker-data";

const TODAY = (() => {
  if (typeof window === "undefined") return "2026-03-01"; // Fallback SSG
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

// Urutan bulan
const MONTHS = Object.keys(MONTH_LABELS);

// Semua kategori unik
const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ProkerCategory[];

function getDayName(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { weekday: "long" });
}
function getDayNum(dateStr: string) {
  return new Date(dateStr).getDate();
}

function isPast(dateStr: string) {
  return dateStr < TODAY;
}
function isToday(dateStr: string) {
  return dateStr === TODAY;
}

export default function ProkerPage() {
  const currentMonth = TODAY.slice(0, 7); // e.g. "2026-04"
  const defaultMonth = MONTHS.includes(currentMonth) ? currentMonth : MONTHS[0];

  const [activeMonth, setActiveMonth] = useState(defaultMonth);
  const [activeCategory, setActiveCategory] = useState<ProkerCategory | "ALL">("ALL");

  // Items untuk bulan & kategori aktif
  const filtered = useMemo(() => {
    return PROKER_DATA.filter((item) => {
      const monthMatch = item.date.startsWith(activeMonth);
      const catMatch = activeCategory === "ALL" || item.category === activeCategory;
      return monthMatch && catMatch;
    });
  }, [activeMonth, activeCategory]);

  // Kelompokkan per tanggal
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    }
    // Sort by date
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Hitung jumlah per bulan (untuk badge)
  const countPerMonth = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of MONTHS) {
      c[m] = PROKER_DATA.filter((i) => i.date.startsWith(m)).length;
    }
    return c;
  }, []);

  // Kategori yang muncul di bulan aktif (untuk filter)
  const catsInMonth = useMemo(() => {
    const s = new Set(
      PROKER_DATA.filter((i) => i.date.startsWith(activeMonth)).map((i) => i.category)
    );
    return ALL_CATEGORIES.filter((c) => s.has(c));
  }, [activeMonth]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Program{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #DC143C, #FF4D6D)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Kerja
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jadwal kegiatan MTO 25/26 — Maret s.d. Desember 2026
        </p>
      </div>

      {/* ── Month Tabs ── */}
      <div
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {MONTHS.map((m) => {
          const isActive = m === activeMonth;
          const label = MONTH_LABELS[m].split(" ")[0]; // "Maret", "April", etc.
          return (
            <button
              key={m}
              id={`proker-month-${m}`}
              onClick={() => {
                setActiveMonth(m);
                setActiveCategory("ALL");
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: "rgba(220,20,60,0.15)",
                      color: "#DC143C",
                      border: "1px solid rgba(220,20,60,0.30)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      color: "var(--muted-foreground)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }
              }
            >
              {label}
              <span
                className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                style={{
                  background: isActive ? "rgba(220,20,60,0.25)" : "rgba(255,255,255,0.08)",
                }}
              >
                {countPerMonth[m]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Category Filter ── */}
      {catsInMonth.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={13} className="shrink-0 text-muted-foreground" />
          <button
            onClick={() => setActiveCategory("ALL")}
            className="rounded-lg px-3 py-1 text-[11px] font-bold transition-all"
            style={
              activeCategory === "ALL"
                ? { background: "rgba(255,255,255,0.12)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.18)" }
                : { background: "transparent", color: "var(--muted-foreground)", border: "1px solid rgba(255,255,255,0.07)" }
            }
          >
            Semua
          </button>
          {catsInMonth.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="rounded-lg px-3 py-1 text-[11px] font-bold transition-all"
                style={
                  isActive
                    ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }
                    : { background: "transparent", color: "var(--muted-foreground)", border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                {cfg.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Timeline ── */}
      {grouped.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl py-20 text-center text-muted-foreground"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <CalendarDays size={40} className="opacity-30" />
          <p className="text-sm">Tidak ada kegiatan untuk filter ini.</p>
        </div>
      ) : (
        <div className="relative space-y-1">
          {/* Vertical line */}
          <div
            className="absolute left-[39px] top-0 bottom-0 w-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {grouped.map(([date, items]) => {
            const past = isPast(date);
            const today = isToday(date);
            return (
              <div key={date} className="flex items-start gap-4">
                {/* Date badge */}
                <div className="relative z-10 flex flex-col items-center shrink-0" style={{ width: 80 }}>
                  <div
                    className="flex flex-col items-center justify-center rounded-xl py-1.5 w-full transition-all"
                    style={{
                      background: today
                        ? "rgba(220,20,60,0.18)"
                        : past
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(255,255,255,0.06)",
                      border: today
                        ? "1px solid rgba(220,20,60,0.40)"
                        : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase leading-none tracking-wider"
                      style={{ color: today ? "#DC143C" : past ? "var(--muted-foreground)" : "#aaa" }}
                    >
                      {getDayName(date).slice(0, 3)}
                    </span>
                    <span
                      className="text-xl font-black leading-tight"
                      style={{ color: today ? "#DC143C" : past ? "rgba(255,255,255,0.3)" : "var(--foreground)" }}
                    >
                      {getDayNum(date)}
                    </span>
                    {today && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-wider"
                        style={{ background: "#DC143C", color: "#fff" }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                </div>

                {/* Events on this date */}
                <div className="flex flex-1 flex-col gap-1.5 py-1">
                  {items.map((item, i) => {
                    const cfg = CATEGORY_CONFIG[item.category];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          background: past ? "rgba(255,255,255,0.02)" : cfg.bg,
                          border: `1px solid ${past ? "rgba(255,255,255,0.05)" : `${cfg.color}25`}`,
                          opacity: past ? 0.55 : 1,
                        }}
                      >
                        {/* Category dot */}
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: cfg.color, boxShadow: past ? "none" : `0 0 6px ${cfg.color}80` }}
                        />
                        <span
                          className="flex-1 text-sm font-semibold"
                          style={{ color: past ? "var(--muted-foreground)" : "var(--foreground)" }}
                        >
                          {item.title}
                        </span>
                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            background: past ? "rgba(255,255,255,0.05)" : `${cfg.color}18`,
                            color: past ? "var(--muted-foreground)" : cfg.color,
                          }}
                        >
                          {cfg.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Legend ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Legenda Kategori
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <span
                key={cat}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                {cfg.shortLabel}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
