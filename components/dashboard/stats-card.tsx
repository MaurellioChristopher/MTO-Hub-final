"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "crimson" | "gold" | "blue" | "green" | "purple";
  trend?: {
    value: number;
    label: string;
  };
  index?: number;
}

const colorMap = {
  crimson: {
    accent: "#DC143C",
    bg: "rgba(220,20,60,0.08)",
    border: "rgba(220,20,60,0.20)",
    iconBg: "rgba(220,20,60,0.15)",
    glow: "rgba(220,20,60,0.15)",
  },
  gold: {
    accent: "#D4AF37",
    bg: "rgba(212,175,55,0.06)",
    border: "rgba(212,175,55,0.18)",
    iconBg: "rgba(212,175,55,0.12)",
    glow: "rgba(212,175,55,0.12)",
  },
  blue: {
    accent: "#4F8EF7",
    bg: "rgba(79,142,247,0.06)",
    border: "rgba(79,142,247,0.18)",
    iconBg: "rgba(79,142,247,0.12)",
    glow: "rgba(79,142,247,0.12)",
  },
  green: {
    accent: "#22C55E",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
    iconBg: "rgba(34,197,94,0.12)",
    glow: "rgba(34,197,94,0.12)",
  },
  purple: {
    accent: "#A855F7",
    bg: "rgba(168,85,247,0.06)",
    border: "rgba(168,85,247,0.18)",
    iconBg: "rgba(168,85,247,0.12)",
    glow: "rgba(168,85,247,0.12)",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "crimson",
  trend,
  index = 0,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl p-5 transition-all duration-300"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: `0 4px 24px ${c.glow}`,
      }}
    >
      {/* Subtle top gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p
            className="mt-2 text-3xl font-bold tracking-tight"
            style={{ color: c.accent }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.value >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            background: c.iconBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <Icon size={22} style={{ color: c.accent }} />
        </div>
      </div>
    </motion.div>
  );
}
