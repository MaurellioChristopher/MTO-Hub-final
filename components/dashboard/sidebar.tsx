"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CalendarCheck,
  Trophy,
  MessageSquare,
  LogOut,
  ChevronRight,
  Shield,
  UserCircle,
  Wallet,
  Camera,
  FolderArchive,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Proker",
    href: "/dashboard/proker",
    icon: CalendarDays,
  },
  {
    label: "Anggota",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "Absensi",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
  },
  {
    label: "MOTM Rating",
    href: "/dashboard/motm",
    icon: Trophy,
  },
  {
    label: "Aspirasi",
    href: "/dashboard/aspirasi",
    icon: MessageSquare,
  },
  {
    label: "Dokumentasi",
    href: "/dashboard/gallery",
    icon: Camera,
  },
  {
    label: "Uang Kas",
    href: "/dashboard/kas",
    icon: Wallet,
  },
  {
    label: "Arsip Berkas",
    href: "/dashboard/arsip",
    icon: FolderArchive,
  },
];

const deptColors: Record<string, string> = {
  INTI: "#DC143C",
  MI: "#D4AF37",
  MP: "#4F8EF7",
  SD: "#22C55E",
  SI: "#A855F7",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "Admin";
  const dept = session?.user?.department ?? "INTI";
  const deptColor = deptColors[dept] ?? "#DC143C";

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-full w-64 flex-col"
      style={{
        background: "linear-gradient(180deg, #0D0D14 0%, #0A0A0F 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-md"
          style={{
            boxShadow: "0 4px 14px rgba(220,20,60,0.35)",
          }}
        >
          <img
            src="/mto-logo.png"
            alt="MTO Logo"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">MTO-Hub</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Portal Organisasi MTO</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Menu
        </p>

        {visibleNav.map((item, idx) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                style={
                  isActive
                    ? {
                        background: "rgba(220,20,60,0.12)",
                        borderLeft: "3px solid #DC143C",
                      }
                    : {}
                }
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-[#DC143C]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight size={14} className="text-[#DC143C] opacity-60" />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mt-3 rounded-xl p-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)` }}
              >
                {session?.user?.name ? getInitials(session.user.name) : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {session?.user?.name ?? "Loading..."}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: deptColor }}
                />
                <span className="text-[10px] text-muted-foreground">{dept}</span>
                {isAdmin && (
                  <Shield size={10} className="text-[#D4AF37]" />
                )}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              id="sidebar-logout"
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
