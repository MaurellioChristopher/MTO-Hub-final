"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, CalendarCheck, Trophy, TrendingUp,
  Clock, Star, Calendar, ArrowRight, CalendarDays,
  MessageSquare, Zap, ChevronRight, Sparkles, Wallet, Camera,
  Megaphone, Pin, PinOff, Trash2, Plus, X, Loader2, AlertTriangle,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { PROKER_DATA, CATEGORY_CONFIG } from "@/lib/proker-data";

// ── Dept config ───────────────────────────────────────────────────────────────
const DEPT_CONFIG = [
  { dept: "INTI", label: "Inti Organisasi",    count: 4, color: "#DC143C" },
  { dept: "MI",   label: "Managerial Internal", count: 7, color: "#D4AF37" },
  { dept: "MP",   label: "Media Publication",   count: 6, color: "#4F8EF7" },
  { dept: "SD",   label: "Self Development",    count: 9, color: "#22C55E" },
  { dept: "SI",   label: "Self Improvement",    count: 7, color: "#A855F7" },
];

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: "Lihat Anggota",
    desc: "Direktori lengkap 33 staff MTO 25/26",
    href: "/dashboard/members",
    color: "#DC143C",
    icon: Users,
  },
  {
    label: "Program Kerja",
    desc: "Jadwal kegiatan Maret–Desember 2026",
    href: "/dashboard/proker",
    color: "#F97316",
    icon: CalendarDays,
  },
  {
    label: "Absensi",
    desc: "Catat kehadiran di setiap event",
    href: "/dashboard/attendance",
    color: "#22C55E",
    icon: CalendarCheck,
  },
  {
    label: "MOTM Rating",
    desc: "Nilai anggota terbaik bulan ini",
    href: "/dashboard/motm",
    color: "#D4AF37",
    icon: Star,
  },
  {
    label: "Aspirasi",
    desc: "Sampaikan aspirasi anonim, gagasan, masukan, maupun kritik untuk perbaikan",
    href: "/dashboard/aspirasi",
    color: "#4F8EF7",
    icon: MessageSquare,
  },
  {
    label: "Dokumentasi",
    desc: "Galeri kenang-kenangan foto kegiatan MTO",
    href: "/dashboard/gallery",
    color: "#A855F7",
    icon: Camera,
  },
  {
    label: "Uang Kas",
    desc: "Rekap iuran bulanan MTO",
    href: "/dashboard/kas",
    color: "#22C55E",
    icon: Wallet,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  date: string;
  description?: string;
  location?: string;
}

interface Pengumuman {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
  author_dept: string;
}

const ANNOUNCE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Penting:  { bg: "rgba(220,20,60,0.12)",   text: "#F87171", border: "rgba(220,20,60,0.35)",   icon: "🚨" },
  Acara:    { bg: "rgba(212,175,55,0.12)",   text: "#FACC15", border: "rgba(212,175,55,0.35)",  icon: "🎉" },
  Keuangan: { bg: "rgba(34,197,94,0.12)",    text: "#4ADE80", border: "rgba(34,197,94,0.35)",   icon: "💰" },
  Umum:     { bg: "rgba(99,102,241,0.12)",   text: "#818CF8", border: "rgba(99,102,241,0.35)",  icon: "📢" },
};

function getEventType(title: string) {
  const t = title.toLowerCase();
  if (t.includes("appraisal"))  return { color: "#D4AF37", label: "Appraisals" };
  if (t.includes("motm"))       return { color: "#A855F7", label: "MOTM" };
  if (t.includes("training"))   return { color: "#22C55E", label: "Training" };
  if (t.includes("visit"))      return { color: "#4F8EF7", label: "Visit" };
  if (t.includes("upgrading"))  return { color: "#EC4899", label: "Upgrading" };
  if (t.includes("night") || t.includes("carnival")) return { color: "#F59E0B", label: "Carnival" };
  if (t.includes("libur") || t.includes("hari") || t.includes("cuti")) return { color: "#6B7280", label: "Libur" };
  return { color: "#DC143C", label: "Event" };
}

// Fade-in-up animation variants
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ── Pengumuman state ──
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [loadingAnn, setLoadingAnn]       = useState(true);
  const [annModal, setAnnModal]           = useState(false);
  const [annTitle, setAnnTitle]           = useState("");
  const [annContent, setAnnContent]       = useState("");
  const [annCategory, setAnnCategory]     = useState("Umum");
  const [annPinned, setAnnPinned]         = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);
  const [annDeletingId, setAnnDeletingId] = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);

  const firstName = session?.user?.name?.split(" ")[0] ?? "...";
  const isAdmin   = session?.user?.role === "Admin";
  const dept      = session?.user?.department ?? "—";
  const now       = new Date();
  const bulan     = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const today     = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchAnnouncements = () => {
    setLoadingAnn(true);
    fetch("/api/pengumuman?limit=10")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setAnnouncements(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingAnn(false));
  };

  useEffect(() => {
    fetch("/api/events/this-month")
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
    fetchAnnouncements();
  }, []);

  const upcoming = events.filter((e) => e.date >= today).slice(0, 6);
  const pastCnt  = events.filter((e) => e.date < today).length;

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) { showToast("Judul dan isi wajib diisi", false); return; }
    setAnnSubmitting(true);
    try {
      const res = await fetch("/api/pengumuman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, content: annContent, category: annCategory, is_pinned: annPinned }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("📢 Pengumuman berhasil dipublikasikan!", true);
      setAnnModal(false);
      setAnnTitle(""); setAnnContent(""); setAnnCategory("Umum"); setAnnPinned(false);
      fetchAnnouncements();
    } catch (err: any) { showToast(err.message, false); }
    finally { setAnnSubmitting(false); }
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    try {
      await fetch("/api/pengumuman", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_pinned: !current }),
      });
      fetchAnnouncements();
    } catch { showToast("Gagal mengubah pin", false); }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    setAnnDeletingId(id);
    try {
      await fetch(`/api/pengumuman?id=${id}`, { method: "DELETE" });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast("Pengumuman dihapus.", true);
    } catch { showToast("Gagal menghapus.", false); }
    finally { setAnnDeletingId(null); }
  };

  // Proker teaser: next 5 items from today
  const nextProker = PROKER_DATA.filter((p) => p.date >= today).slice(0, 5);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Global Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            style={{ background: toast.ok ? "linear-gradient(135deg,#22C55E,#16A34A)" : "linear-gradient(135deg,#DC143C,#8B0000)" }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pengumuman Modal (Admin) ── */}
      <AnimatePresence>
        {annModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
              onClick={() => !annSubmitting && setAnnModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 shadow-2xl"
              style={{ background: "#0D0D14", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Megaphone size={20} className="text-[#DC143C]" /> Buat Pengumuman
                </h2>
                <button onClick={() => !annSubmitting && setAnnModal(false)} className="rounded-full p-1.5 hover:bg-white/10 text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAnnSubmit} className="space-y-3.5">
                <input
                  value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Judul pengumuman..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 focus:ring-2 focus:ring-[#DC143C]/40"
                  maxLength={200} disabled={annSubmitting}
                />
                <select
                  value={annCategory} onChange={(e) => setAnnCategory(e.target.value)}
                  disabled={annSubmitting}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-white/10 bg-[#0D0D14] text-foreground focus:ring-2 focus:ring-[#DC143C]/40"
                >
                  {["Umum", "Penting", "Acara", "Keuangan"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={annContent} onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Isi pengumuman..."
                  rows={4}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 focus:ring-2 focus:ring-[#DC143C]/40"
                  maxLength={1000} disabled={annSubmitting}
                />
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setAnnPinned(!annPinned)}
                    className="w-10 h-5 rounded-full transition-all duration-300 flex items-center px-0.5"
                    style={{ background: annPinned ? "#DC143C" : "rgba(255,255,255,0.1)" }}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${annPinned ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">📌 Sematkan di atas</span>
                </label>
                <button
                  type="submit" id="btn-submit-pengumuman"
                  disabled={annSubmitting || !annTitle.trim() || !annContent.trim()}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 20px rgba(220,20,60,0.3)" }}
                >
                  {annSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" /> Memposting...</span> : "📢 Publikasikan"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          HERO — Welcome banner
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0)}>
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, rgba(220,20,60,0.12) 0%, rgba(139,0,0,0.08) 50%, rgba(10,10,15,0) 100%)",
            border: "1px solid rgba(220,20,60,0.20)",
          }}
        >
          {/* Decorative glow orbs */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #DC143C, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #FF4D6D, transparent 70%)" }}
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#D4AF37]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  MTO 25/26 Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Halo,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #DC143C 0%, #FF6B8A 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {firstName}! 👋
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isAdmin ? "Admin MTO" : `Departemen ${dept}`} · {bulan}
              </p>
            </div>

            {/* Date pill */}
            <div
              className="flex flex-col items-center justify-center rounded-2xl px-5 py-3 shrink-0"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.22)",
              }}
            >
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Clock size={13} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {now.toLocaleDateString("id-ID", { weekday: "long" })}
                </span>
              </div>
              <p className="text-xl font-black text-foreground mt-0.5">
                {now.getDate()} {now.toLocaleDateString("id-ID", { month: "short" })} {now.getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          PAPAN PENGUMUMAN
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.05)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ background: "rgba(220,20,60,0.15)", border: "1px solid rgba(220,20,60,0.3)" }}>
              <Megaphone size={14} className="text-[#DC143C]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Papan Pengumuman</p>
            {announcements.filter(a => a.is_pinned).length > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: "rgba(220,20,60,0.15)", color: "#F87171" }}>
                {announcements.filter(a => a.is_pinned).length} PINNED
              </span>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setAnnModal(true)}
              id="btn-add-pengumuman"
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 14px rgba(220,20,60,0.3)" }}
            >
              <Plus size={13} /> Buat
            </button>
          )}
        </div>

        {loadingAnn ? (
          <div className="flex items-center gap-3 py-6 px-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Loader2 size={18} className="animate-spin text-[#DC143C]" />
            <p className="text-sm text-muted-foreground">Memuat pengumuman...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex items-center gap-3 py-6 px-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
            <Megaphone size={22} className="opacity-20 text-[#DC143C]" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Belum ada pengumuman</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{isAdmin ? "Klik \"Buat\" untuk post pengumuman pertama." : "Admin belum memposting pengumuman."}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {announcements.map((ann, i) => {
              const cfg = ANNOUNCE_COLORS[ann.category] || ANNOUNCE_COLORS["Umum"];
              const isExpanded = expandedId === ann.id;
              const relTime = (() => {
                const diff = Date.now() - new Date(ann.created_at).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 60) return mins <= 1 ? "Baru saja" : `${mins} menit lalu`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs} jam lalu`;
                return new Date(ann.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
              })();
              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-200"
                  style={{
                    background: ann.is_pinned ? cfg.bg : "rgba(255,255,255,0.025)",
                    border: ann.is_pinned ? `1px solid ${cfg.border}` : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Pinned left border accent */}
                  {ann.is_pinned && (
                    <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl" style={{ background: cfg.text }} />
                  )}

                  <div
                    className="flex cursor-pointer items-start gap-3 px-5 py-3.5"
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                  >
                    {/* Category emoji */}
                    <span className="mt-0.5 text-base shrink-0">{cfg.icon}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        {ann.is_pinned && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.text }}>
                            <Pin size={9} /> Disematkan
                          </span>
                        )}
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase" style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                          {ann.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">{relTime}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug">{ann.title}</p>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                            <p className="mt-2 text-[10px] text-muted-foreground/40">
                              Oleh <span className="font-bold text-muted-foreground/60">{ann.author_name}</span> · {ann.author_dept}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!isExpanded && (
                        <p className="mt-0.5 text-xs text-muted-foreground/50 line-clamp-1">{ann.content}</p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight
                      size={15}
                      className="shrink-0 mt-1 text-muted-foreground/40 transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </div>

                  {/* Admin actions — visible on hover */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 px-5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-colors hover:bg-white/10"
                        style={{ color: ann.is_pinned ? cfg.text : "rgba(255,255,255,0.3)" }}
                      >
                        {ann.is_pinned ? <PinOff size={11} /> : <Pin size={11} />}
                        {ann.is_pinned ? "Lepas Pin" : "Sematkan"}
                      </button>
                      <button
                        onClick={() => handleDeleteAnn(ann.id)}
                        disabled={annDeletingId === ann.id}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        {annDeletingId === ann.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        Hapus
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          STATS — 4 cards
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.07)}>
        <SectionLabel>Statistik Organisasi</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Anggota",
              value: "33",
              subtitle: "5 Departemen aktif",
              icon: Users,
              color: "#DC143C",
              href: "/dashboard/members",
            },
            {
              title: "Event Bulan Ini",
              value: loadingEvents ? "..." : String(events.length),
              subtitle: loadingEvents ? "Memuat..." : `${upcoming.length} mendatang · ${pastCnt} selesai`,
              icon: CalendarCheck,
              color: "#D4AF37",
              href: "/dashboard/attendance",
            },
            {
              title: "MOTM Bulan Ini",
              value: "—",
              subtitle: "Voting belum dibuka",
              icon: Trophy,
              color: "#A855F7",
              href: "/dashboard/motm",
            },
            {
              title: "Rata-rata Absensi",
              value: "—",
              subtitle: "Belum ada data",
              icon: TrendingUp,
              color: "#22C55E",
              href: "/dashboard/attendance",
            },
          ].map((card, i) => (
            <motion.button
              key={card.title}
              onClick={() => router.push(card.href)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.18 } }}
              whileTap={{ scale: 0.97 }}
              className="group relative w-full rounded-2xl p-5 text-left transition-shadow duration-300"
              style={{
                background: `${card.color}09`,
                border: `1px solid ${card.color}25`,
                boxShadow: `0 4px 24px ${card.color}12`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${card.color}80, transparent)` }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-black" style={{ color: card.color }}>
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{card.subtitle}</p>
                </div>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}
                >
                  <card.icon size={22} style={{ color: card.color }} />
                </div>
              </div>
              {/* Arrow hint on hover */}
              <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] font-semibold" style={{ color: card.color }}>Lihat detail</span>
                <ChevronRight size={11} style={{ color: card.color }} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          2-COLUMN: Events + Proker teaser
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.18)} className="grid gap-6 lg:grid-cols-5">

        {/* ── Events this month (3/5) ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Event Bulan Ini — {bulan}</SectionLabel>
            <button
              onClick={() => router.push("/dashboard/attendance")}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>

          {loadingEvents ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div
              className="flex items-center gap-3 rounded-2xl p-8 text-muted-foreground"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
            >
              <Calendar size={28} className="opacity-30" />
              <div>
                <p className="text-sm font-semibold">Tidak ada event bulan ini</p>
                <p className="text-xs opacity-60 mt-0.5">Cek kembali nanti</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((event, i) => {
                const type    = getEventType(event.title);
                const isToday = event.date === today;
                return (
                  <motion.button
                    key={event.id}
                    onClick={() => router.push("/dashboard/attendance")}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.98 }}
                    className="group w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
                    style={{
                      background: `${type.color}08`,
                      border: `1px solid ${type.color}22`,
                    }}
                  >
                    {/* Date badge */}
                    <div
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center"
                      style={{ background: `${type.color}18`, border: `1px solid ${type.color}35` }}
                    >
                      <span className="text-[9px] font-bold uppercase leading-none" style={{ color: type.color }}>
                        {new Date(event.date).toLocaleDateString("id-ID", { month: "short" })}
                      </span>
                      <span className="text-sm font-black leading-tight" style={{ color: type.color }}>
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {isToday && (
                          <span className="inline-flex h-4 items-center rounded-full px-1.5 text-[9px] font-black" style={{ background: "#D4AF37", color: "#000" }}>
                            HARI INI
                          </span>
                        )}
                        {event.title}
                      </p>
                      {event.location && event.location !== "-" && (
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: `${type.color}18`, color: type.color }}
                      >
                        {type.label}
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Proker Teaser (2/5) ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Proker Mendatang</SectionLabel>
            <button
              onClick={() => router.push("/dashboard/proker")}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>

          <div
            className="rounded-2xl p-1 space-y-1"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {nextProker.map((p, i) => {
              const cfg = CATEGORY_CONFIG[p.category];
              const d   = new Date(p.date);
              const isToday = p.date === today;
              return (
                <motion.button
                  key={i}
                  onClick={() => router.push("/dashboard/proker")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                  style={{
                    background: isToday ? `${cfg.color}10` : "transparent",
                    border: isToday ? `1px solid ${cfg.color}30` : "1px solid transparent",
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg"
                    style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
                  >
                    <span className="text-[8px] font-bold leading-none" style={{ color: cfg.color }}>
                      {d.toLocaleDateString("id-ID", { month: "short" })}
                    </span>
                    <span className="text-xs font-black leading-tight" style={{ color: cfg.color }}>
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{p.title}</p>
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold mt-0.5"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}
                    >
                      {cfg.shortLabel}
                    </span>
                  </div>
                  {isToday && (
                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black" style={{ background: cfg.color, color: "#fff" }}>
                      TODAY
                    </span>
                  )}
                </motion.button>
              );
            })}

            <button
              onClick={() => router.push("/dashboard/proker")}
              className="group w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground hover:bg-white/5"
            >
              <CalendarDays size={13} />
              Lihat jadwal lengkap
              <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          DEPARTMENT OVERVIEW
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.26)}>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Struktur Departemen</SectionLabel>
          <button
            onClick={() => router.push("/dashboard/members")}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Lihat anggota <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DEPT_CONFIG.map((dept, i) => (
            <motion.button
              key={dept.dept}
              onClick={() => router.push("/dashboard/members")}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -4, boxShadow: `0 8px 30px ${dept.color}20`, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className="group w-full rounded-2xl p-4 text-left transition-all duration-300"
              style={{
                background: `${dept.color}0D`,
                border: `1px solid ${dept.color}28`,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-black tracking-wider"
                  style={{ background: `${dept.color}20`, color: dept.color, border: `1px solid ${dept.color}40` }}
                >
                  {dept.dept}
                </span>
                <span className="text-lg font-black" style={{ color: dept.color }}>
                  {dept.count}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug group-hover:text-foreground/70 transition-colors">
                {dept.label}
              </p>
              <div className="mt-3">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(dept.count / 33) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                    style={{ background: `linear-gradient(90deg, ${dept.color}80, ${dept.color})` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground/50">
                  {Math.round((dept.count / 33) * 100)}%
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          QUICK ACTIONS — all 5 menu items
      ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.34)}>
        <SectionLabel>Aksi Cepat</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.href}
              onClick={() => router.push(action.href)}
              id={`quick-action-${i}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38 + i * 0.06, duration: 0.35 }}
              whileHover={{ y: -5, boxShadow: `0 12px 36px ${action.color}25`, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-all duration-200"
              style={{
                background: `${action.color}09`,
                border: `1px solid ${action.color}28`,
              }}
            >
              {/* Top line glow */}
              <div
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${action.color}, transparent)` }}
              />
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: `${action.color}18`, border: `1px solid ${action.color}35` }}
              >
                <action.icon size={18} style={{ color: action.color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{action.desc}</p>
              </div>
              <div className="flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Zap size={10} style={{ color: action.color }} />
                <span className="text-[10px] font-semibold" style={{ color: action.color }}>Buka →</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  );
}
