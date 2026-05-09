"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarCheck, CheckCircle2, XCircle, Clock,
  ChevronRight, Loader2, MapPin, Calendar,
  AlertCircle, ArrowLeft, RefreshCw, CalendarDays,
} from "lucide-react";
import { PROKER_DATA, CATEGORY_CONFIG } from "@/lib/proker-data";

// ── Bulan-bulan aktif MTO 25/26 ───────────────────────────────────────────────
const MONTHS = [
  { value: "2026-03", label: "Mar" },
  { value: "2026-04", label: "Apr" },
  { value: "2026-05", label: "Mei" },
  { value: "2026-06", label: "Jun" },
  { value: "2026-07", label: "Jul" },
  { value: "2026-08", label: "Agu" },
  { value: "2026-09", label: "Sep" },
  { value: "2026-10", label: "Okt" },
  { value: "2026-11", label: "Nov" },
  { value: "2026-12", label: "Des" },
];

function getMonthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${ym}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function getCurrentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttendanceEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  location?: string;
  attendance_summary: {
    present: number;
    excused: number;
    absent: number;
    total: number;
  };
}

interface MemberAttendance {
  id: string;
  name: string;
  nim: string;
  department: string;
  role: string;
  attendance: {
    id: string;
    status: "present" | "absent" | "excused";
    timestamp: string;
  } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPT_COLORS: Record<string, string> = {
  INTI: "#DC143C",
  MI:   "#D4AF37",
  MP:   "#4F8EF7",
  SD:   "#22C55E",
  SI:   "#A855F7",
};

const STATUS_CONFIG = {
  present: {
    label:  "Hadir",
    icon:   CheckCircle2,
    color:  "#22C55E",
    bg:     "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.30)",
  },
  excused: {
    label:  "Izin",
    icon:   Clock,
    color:  "#D4AF37",
    bg:     "rgba(212,175,55,0.12)",
    border: "rgba(212,175,55,0.30)",
  },
  absent: {
    label:  "Alpha",
    icon:   XCircle,
    color:  "#DC143C",
    bg:     "rgba(220,20,60,0.12)",
    border: "rgba(220,20,60,0.30)",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getLocalTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isUpcoming(date: string) {
  return date >= getLocalTodayStr();
}

function isToday(date: string) {
  return date === getLocalTodayStr();
}

function getEventTag(title: string) {
  if (title.toLowerCase().includes("appraisal")) return { label: "Appraisals", color: "#D4AF37" };
  if (title.toLowerCase().includes("motm"))       return { label: "MOTM",       color: "#A855F7" };
  if (title.toLowerCase().includes("training"))   return { label: "Training",   color: "#22C55E" };
  if (title.toLowerCase().includes("visit"))      return { label: "Visit",      color: "#4F8EF7" };
  if (title.toLowerCase().includes("night"))      return { label: "Gala",       color: "#F97316" };
  if (title.toLowerCase().includes("discussion")) return { label: "Diskusi",    color: "#06B6D4" };
  if (title.toLowerCase().includes("upgrading"))  return { label: "Upgrading",  color: "#EC4899" };
  if (title.toLowerCase().includes("libur") ||
      title.toLowerCase().includes("hari") ||
      title.toLowerCase().includes("cuti"))       return { label: "Libur",      color: "#6B7280" };
  return { label: "Event", color: "#DC143C" };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { data: session } = useSession();
  const [events, setEvents]             = useState<AttendanceEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
  const [members, setMembers]           = useState<MemberAttendance[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue());

  const isAdmin = session?.user?.role === "Admin";
  const myId    = session?.user?.id;

  // Fetch events berdasarkan bulan yang dipilih
  const fetchEvents = useCallback((monthValue: string) => {
    setLoading(true);
    const { from, to } = getMonthRange(monthValue);
    fetch(`/api/attendance/events?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setEvents(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents(selectedMonth);
  }, [selectedMonth, fetchEvents]);

  // Fetch members for selected event
  const fetchMembers = useCallback(async (eventId: string) => {
    setLoadingMembers(true);
    try {
      const res  = await fetch(`/api/attendance/${eventId}`);
      const data = await res.json();
      setMembers(data ?? []);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchMembers(selectedEvent.id);
  }, [selectedEvent, fetchMembers]);

  // Update attendance
  async function markAttendance(userId: string, status: StatusKey) {
    if (!selectedEvent) return;

    // Non-admin hanya bisa update diri sendiri
    if (!isAdmin && userId !== myId) return;

    setUpdating(userId + status);
    try {
      const res  = await fetch(`/api/attendance/${selectedEvent.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, status }),
      });
      if (!res.ok) throw new Error("Failed");

      // Optimistic update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === userId
            ? { ...m, attendance: { id: "", status, timestamp: new Date().toISOString() } }
            : m
        )
      );

      // Refresh event summary (sesuai bulan yang dipilih)
      const { from, to } = getMonthRange(selectedMonth);
      const updatedEvents = await fetch(`/api/attendance/events?from=${from}&to=${to}`).then((r) => r.json());
      setEvents(updatedEvents ?? []);
      setSelectedEvent((prev) =>
        prev ? (updatedEvents ?? []).find((e: AttendanceEvent) => e.id === prev.id) ?? prev : null
      );

      showToast(
        userId === myId
          ? `Status Anda: ${STATUS_CONFIG[status].label}`
          : `${STATUS_CONFIG[status].label} dicatat ✓`
      );
    } catch {
      showToast("Gagal menyimpan, coba lagi");
    } finally {
      setUpdating(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Kelompokkan event berdasarkan upcoming/past relatif ke hari ini
  const upcomingEvents = events.filter((e) => isUpcoming(e.date));
  const pastEvents     = events.filter((e) => !isUpcoming(e.date));

  // Kelompokkan member per dept
  const depts = ["INTI", "MI", "MP", "SD", "SI"] as const;
  const membersByDept = depts.reduce<Record<string, MemberAttendance[]>>((acc, d) => {
    acc[d] = members.filter((m) => m.department === d);
    return acc;
  }, { INTI: [], MI: [], MP: [], SD: [], SI: [] });

  // Summary counts
  const present = members.filter((m) => m.attendance?.status === "present").length;
  const excused = members.filter((m) => m.attendance?.status === "excused").length;
  const absent  = members.filter((m) => m.attendance?.status === "absent").length;
  const unmarked = members.length - present - excused - absent;

  // ── Proker reference (bulan yang dipilih) ─────────────────────────────────
  const TODAY_STR = getLocalTodayStr();
  const { from: prokerFrom, to: prokerTo } = getMonthRange(selectedMonth);
  const nearbyProker = PROKER_DATA.filter(
    (p) => p.date >= prokerFrom && p.date <= prokerTo
  );

  // Label bulan yang sedang dipilih
  const selectedMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-6">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 shadow-2xl text-sm font-semibold text-white animate-fade-in-up"
          style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", backdropFilter: "blur(12px)" }}
        >
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      {/* ── Detail View (full width) ── */}
      {selectedEvent ? (
        <div className="flex flex-col gap-5">
          {/* Back + Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => { setSelectedEvent(null); setMembers([]); }}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">Absensi Event</p>
                <h1 className="text-xl font-bold text-foreground">{selectedEvent.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(selectedEvent.date)}
                  </span>
                  {selectedEvent.location && selectedEvent.location !== "-" && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {selectedEvent.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchMembers(selectedEvent.id)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground self-start sm:self-center"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Hadir",     value: present,  color: "#22C55E" },
              { label: "Izin",      value: excused,  color: "#D4AF37" },
              { label: "Alpha",     value: absent,   color: "#DC143C" },
              { label: "Belum",     value: unmarked, color: "#6B7280" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center rounded-2xl py-3 gap-0.5"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
              >
                <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {members.length > 0 && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 flex">
              <div className="h-full transition-all duration-500" style={{ width: `${(present / 33) * 100}%`, background: "#22C55E" }} />
              <div className="h-full transition-all duration-500" style={{ width: `${(excused / 33) * 100}%`, background: "#D4AF37" }} />
              <div className="h-full transition-all duration-500" style={{ width: `${(absent  / 33) * 100}%`, background: "#DC143C" }} />
            </div>
          )}

          {/* Non-admin note */}
          {!isAdmin && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", color: "#D4AF37" }}
            >
              <AlertCircle size={13} />
              Anda hanya dapat mengubah status kehadiran diri sendiri.
            </div>
          )}

          {/* Member list by dept */}
          {loadingMembers ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 size={28} className="animate-spin mr-3" />
              <span className="text-sm">Memuat daftar anggota...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {depts.map((dept) => {
                const deptMembers = membersByDept[dept];
                if (!deptMembers.length) return null;
                const color = DEPT_COLORS[dept];
                return (
                  <section key={dept}>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
                      <span
                        className="rounded-lg px-3 py-1 text-xs font-black tracking-wider"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                      >
                        {dept}
                      </span>
                      <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${color}40, transparent)` }} />
                    </div>

                    <div className="space-y-2">
                      {deptMembers.map((member) => {
                        const status    = member.attendance?.status ?? null;
                        const isMe      = member.id === myId;
                        const canUpdate = isAdmin || isMe;
                        const isUpdating = updating?.startsWith(member.id);

                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
                            style={{
                              background: isMe ? "rgba(220,20,60,0.05)" : "rgba(255,255,255,0.02)",
                              border: isMe ? "1px solid rgba(220,20,60,0.20)" : "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {/* Avatar */}
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white"
                              style={{ background: color, opacity: status === "absent" ? 0.5 : 1 }}
                            >
                              {getInitials(member.name)}
                            </div>

                            {/* Name */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {member.name}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(Anda)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.nim}</p>
                            </div>

                            {/* Status buttons */}
                            <div className="flex shrink-0 items-center gap-1.5">
                              {(["present", "excused", "absent"] as StatusKey[]).map((s) => {
                                const cfg     = STATUS_CONFIG[s];
                                const isActive = status === s;
                                const Icon     = cfg.icon;
                                return (
                                  <button
                                    key={s}
                                    id={`att-${member.id}-${s}`}
                                    disabled={!canUpdate || isUpdating != null}
                                    onClick={() => markAttendance(member.id, s)}
                                    title={cfg.label}
                                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={
                                      isActive
                                        ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, boxShadow: `0 0 10px ${cfg.color}30` }
                                        : {
                                            background: "rgba(255,255,255,0.04)",
                                            color: "var(--muted-foreground)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                          }
                                    }
                                  >
                                    {isUpdating && updating === member.id + s ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Icon size={13} />
                                    )}
                                    <span className="hidden sm:inline">{cfg.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Event List View — 2 column layout ── */
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">

          {/* ════ LEFT: Proker Reference Panel ════ */}
          <div
            className="lg:sticky lg:top-0 lg:w-72 shrink-0 rounded-2xl p-4 space-y-3"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={14} className="text-[#DC143C]" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                Jadwal Proker
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Agenda mendatang berdasarkan program kerja MTO 25/26.
            </p>

            <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
              {nearbyProker.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Tidak ada agenda mendatang.</p>
              ) : (
                nearbyProker.map((p, i) => {
                  const cfg = CATEGORY_CONFIG[p.category];
                  const d = new Date(p.date);
                  const isToday = p.date === TODAY_STR;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all"
                      style={{
                        background: isToday ? `${cfg.color}12` : "rgba(255,255,255,0.025)",
                        border: isToday ? `1px solid ${cfg.color}35` : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {/* Day badge */}
                      <div
                        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg"
                        style={{
                          background: isToday ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isToday ? `${cfg.color}40` : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <span className="text-[8px] font-bold uppercase leading-none" style={{ color: cfg.color }}>
                          {d.toLocaleDateString("id-ID", { month: "short" })}
                        </span>
                        <span className="text-sm font-black leading-tight" style={{ color: isToday ? cfg.color : "var(--foreground)" }}>
                          {d.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{p.title}</p>
                        <span
                          className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold mt-0.5"
                          style={{ background: `${cfg.color}18`, color: cfg.color }}
                        >
                          {cfg.shortLabel}
                        </span>
                      </div>

                      {isToday && (
                        <span
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black"
                          style={{ background: cfg.color, color: "#fff" }}
                        >
                          TODAY
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ════ RIGHT: Attendance Event List ════ */}
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Absensi{" "}
                <span style={{
                  background: "linear-gradient(135deg,#DC143C,#FF4D6D)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Kehadiran
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih event untuk mencatat kehadiran anggota MTO 25/26
              </p>

              {/* ── Filter Bulan ── */}
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {MONTHS.map((m) => {
                  const isActive  = m.value === selectedMonth;
                  const isCurrent = m.value === getCurrentMonthValue();
                  const isPast    = m.value < getCurrentMonthValue();
                  return (
                    <button
                      key={m.value}
                      id={`month-filter-${m.value}`}
                      onClick={() => {
                        setSelectedMonth(m.value);
                        setSelectedEvent(null);
                        setMembers([]);
                      }}
                      className="shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200"
                      style={
                        isActive
                          ? {
                              background: "linear-gradient(135deg,#DC143C,#8B0000)",
                              color: "#fff",
                              boxShadow: "0 0 14px rgba(220,20,60,0.4)",
                              border: "1px solid rgba(220,20,60,0.6)",
                            }
                          : {
                              background: isCurrent
                                ? "rgba(220,20,60,0.08)"
                                : isPast
                                  ? "rgba(255,255,255,0.04)"
                                  : "rgba(255,255,255,0.02)",
                              color: isCurrent && !isActive
                                ? "#DC143C"
                                : isPast
                                  ? "var(--muted-foreground)"
                                  : "rgba(255,255,255,0.35)",
                              border: isCurrent && !isActive
                                ? "1px solid rgba(220,20,60,0.25)"
                                : "1px solid rgba(255,255,255,0.07)",
                            }
                      }
                    >
                      {m.label}
                      {isCurrent && (
                        <span
                          className="ml-1 inline-block h-1 w-1 rounded-full align-middle"
                          style={{ background: isActive ? "#fff" : "#DC143C" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 size={28} className="animate-spin mr-3" />
                <span className="text-sm">Memuat agenda...</span>
              </div>
            ) : (
              <>
                {/* Upcoming (dalam bulan terpilih) */}
                {upcomingEvents.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {selectedMonth === getCurrentMonthValue() ? "Agenda Mendatang" : `Event ${selectedMonthLabel} 2026`}
                    </p>
                    <div className="space-y-2">
                      {upcomingEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          upcoming
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past (dalam bulan terpilih) */}
                {pastEvents.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {selectedMonth < getCurrentMonthValue() ? `Event ${selectedMonthLabel} 2026` : "Event Sudah Berlalu"}
                    </p>
                    <div className="space-y-2" style={{ opacity: selectedMonth < getCurrentMonthValue() ? 1 : 0.7 }}>
                      {pastEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          upcoming={false}
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {events.length === 0 && (
                  <div
                    className="flex flex-col items-center gap-3 rounded-2xl py-20 text-center text-muted-foreground"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
                  >
                    <CalendarCheck size={40} className="opacity-30" />
                    <p className="text-sm">Tidak ada event di bulan {selectedMonthLabel}.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({
  event, upcoming, onClick,
}: { event: AttendanceEvent; upcoming: boolean; onClick: () => void }) {
  const today  = getLocalTodayStr();
  const isNow  = event.date === today;
  const tag    = getEventTag(event.title);
  const d      = new Date(event.date);
  const { present, excused, absent, total } = event.attendance_summary;
  const unmarked = 33 - total;
  const pct      = total > 0 ? Math.round((present / 33) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: upcoming ? `${tag.color}08` : "rgba(255,255,255,0.02)",
        border: `1px solid ${upcoming ? `${tag.color}25` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Date badge */}
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
          style={{
            background: upcoming ? `${tag.color}15` : "rgba(255,255,255,0.04)",
            border: `1px solid ${upcoming ? `${tag.color}30` : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <span className="text-[9px] font-bold uppercase leading-none" style={{ color: tag.color }}>
            {d.toLocaleDateString("id-ID", { month: "short" })}
          </span>
          <span className="text-lg font-black leading-tight" style={{ color: tag.color }}>
            {d.getDate()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            {isNow && (
              <span className="inline-flex h-4 items-center rounded-full px-2 text-[9px] font-bold text-black" style={{ background: "#D4AF37" }}>
                HARI INI
              </span>
            )}
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${tag.color}18`, color: tag.color }}
            >
              {tag.label}
            </span>
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
          {event.location && event.location !== "-" && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin size={10} />
              {event.location}
            </p>
          )}

          {/* Mini attendance bar */}
          {total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 flex">
                <div className="h-full transition-all" style={{ width: `${(present/33)*100}%`, background: "#22C55E" }} />
                <div className="h-full transition-all" style={{ width: `${(excused/33)*100}%`, background: "#D4AF37" }} />
                <div className="h-full transition-all" style={{ width: `${(absent /33)*100}%`, background: "#DC143C" }} />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{total}/33</span>
            </div>
          )}
        </div>

        {/* Summary chips + arrow */}
        <div className="flex shrink-0 items-center gap-2">
          {total > 0 ? (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
              <span className="font-bold" style={{ color: "#22C55E" }}>✓{present}</span>
              <span className="font-bold" style={{ color: "#D4AF37" }}>~{excused}</span>
              <span className="font-bold" style={{ color: "#DC143C" }}>✗{absent}</span>
              {unmarked > 0 && <span className="text-muted-foreground">?{unmarked}</span>}
            </div>
          ) : (
            <span className="hidden sm:block text-[11px] text-muted-foreground">Belum ada data</span>
          )}
          <ChevronRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
