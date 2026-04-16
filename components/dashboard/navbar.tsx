"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Selamat datang kembali di MTO-Hub",
  },
  "/dashboard/members": {
    title: "Manajemen Anggota",
    subtitle: "Data 33 anggota MTO 25/26",
  },
  "/dashboard/attendance": {
    title: "Absensi",
    subtitle: "Rekap kehadiran event MTO",
  },
  "/dashboard/motm": {
    title: "MOTM Rating",
    subtitle: "Penilaian Member of the Month",
  },
  "/dashboard/feedback": {
    title: "Feedback & Evaluasi",
    subtitle: "Formulir evaluasi event dan anggota",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const deptColors: Record<string, string> = {
  INTI: "#DC143C",
  MI: "#D4AF37",
  MP: "#4F8EF7",
  SD: "#22C55E",
  SI: "#A855F7",
};

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = pageTitles[pathname] ?? {
    title: "MTO-Hub",
    subtitle: "Portal Organisasi MTO",
  };

  const dept = session?.user?.department ?? "INTI";
  const deptColor = deptColors[dept] ?? "#DC143C";

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 px-4 md:px-6"
      style={{
        background: "rgba(10,10,15,0.80)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Mobile menu trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger>
          <button
            id="mobile-menu-trigger"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden"
          >
            <Menu size={20} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r-0">
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground leading-tight truncate">
          {currentPage.title}
        </h2>
        <p className="text-xs text-muted-foreground leading-tight hidden sm:block">
          {currentPage.subtitle}
        </p>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          id="notification-bell"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Notifikasi"
        >
          <Bell size={18} />
          <span
            className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full"
            style={{ background: "#DC143C", boxShadow: "0 0 6px rgba(220,20,60,0.7)" }}
          />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-foreground leading-tight">
              {session?.user?.name?.split(" ")[0] ?? "User"}
            </p>
            <div className="flex items-center justify-end gap-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: deptColor }}
              />
              <p className="text-[10px] text-muted-foreground leading-tight">
                {dept} · MTO 25/26
              </p>
            </div>
          </div>

          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback
              className="text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)` }}
            >
              {session?.user?.name ? getInitials(session.user.name) : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
