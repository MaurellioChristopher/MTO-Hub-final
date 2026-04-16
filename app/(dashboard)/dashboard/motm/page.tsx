"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, CheckCircle2, Loader2, AlertCircle,
  BarChart3, Users, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member { id: string; name: string; nim: string; department: string; role: string }
interface Scores  { q1: number; q2: number; q3: number; q4: number; q5: number }
interface ExistingRating { target_id: string; score: number; feedback_text: string }
interface ResultEntry extends Member {
  avgScore: number; raterCount: number;
  q1Avg: number; q2Avg: number; q3Avg: number; q4Avg: number; q5Avg: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"];

const QUESTIONS = [
  { key:"q1" as keyof Scores, title:"Manajemen Waktu & Prioritas",
    question:"Bagaimana kemampuan staf dalam mengelola waktu dan prioritas pekerjaan?",
    scaleMin:"Tidak Efektif", scaleMax:"Sangat Efektif", color:"#4F8EF7" },
  { key:"q2" as keyof Scores, title:"Kualitas Hasil Kerja (Output)",
    question:"Bagaimana kemampuan staf dalam menyelesaikan tugas dengan kualitas yang baik?",
    scaleMin:"Tidak Baik", scaleMax:"Sangat Baik", color:"#22C55E" },
  { key:"q3" as keyof Scores, title:"Kontribusi terhadap Tujuan Departemen",
    question:"Sejauh mana staf berkontribusi dalam departemen untuk mencapai tujuan bersama?",
    scaleMin:"Tidak Baik", scaleMax:"Sangat Baik", color:"#F97316" },
  { key:"q4" as keyof Scores, title:"Dampak pada Lingkungan Organisasi",
    question:"Sejauh mana staf berkontribusi dalam membangun lingkungan yang mendukung dan positif?",
    scaleMin:"Tidak Ada", scaleMax:"Sangat Besar", color:"#EC4899" },
  { key:"q5" as keyof Scores, title:"Tingkat Kepuasan Keseluruhan",
    question:"Seberapa puas Anda dengan kualitas kinerja staf?",
    scaleMin:"Tidak Puas", scaleMax:"Sangat Puas", color:"#D4AF37" },
];

const DEPT_COLORS: Record<string, string> = {
  INTI:"#DC143C", MI:"#D4AF37", MP:"#4F8EF7", SD:"#22C55E", SI:"#A855F7",
};

const Q_LABELS = ["Waktu","Output","Kontribusi","Attitude","Kepuasan"];
const EMPTY: Scores = { q1:0, q2:0, q3:0, q4:0, q5:0 };

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, color, disabled }: {
  value: number; onChange: (v: number) => void; color: string; disabled?: boolean;
}) {
  const [hov, setHov] = useState(0);
  const active = hov || value;
  const labels = ["","Sangat Kurang","Kurang","Cukup","Baik","Sangat Baik"];
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" disabled={disabled}
          onClick={() => !disabled && onChange(s)}
          onMouseEnter={() => !disabled && setHov(s)}
          onMouseLeave={() => setHov(0)}
          className="transition-transform disabled:cursor-not-allowed"
          style={{ transform: s <= active ? "scale(1.2)" : "scale(1)" }}
        >
          <Star size={22} style={{
            color: s <= active ? color : "rgba(255,255,255,0.10)",
            fill:  s <= active ? color : "transparent",
            filter: s <= active ? `drop-shadow(0 0 5px ${color}90)` : "none",
            transition: "all 0.12s",
          }} />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-[11px] font-bold" style={{ color }}>
          {labels[value]}
        </span>
      )}
    </div>
  );
}

// ── Score Bar (for admin view) ────────────────────────────────────────────────
function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(value / 5) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MotmPage() {
  const { data: session } = useSession();
  const now = new Date();

  const isAdmin  = session?.user?.role === "Admin";
  const myId     = session?.user?.id ?? "";
  const myName   = session?.user?.name ?? "";
  const dept     = session?.user?.department ?? "";
  const deptColor = DEPT_COLORS[dept] ?? "#DC143C";

  // Shared state
  const [activeTab, setActiveTab] = useState<"rate"|"results">(isAdmin ? "results" : "rate");
  const [selMonth, setSelMonth]   = useState(now.getMonth()); // 0-indexed
  const [selYear]                 = useState(now.getFullYear());
  const [showMonths, setShowMonths] = useState(false);

  // ── Rate tab state ───────────────────────────────────────────────────
  const [targets, setTargets]         = useState<Member[]>([]);
  const [loadingTargets, setLoading]  = useState(false);
  const [ratingsMap, setRatingsMap]   = useState<Record<string, Scores>>({});
  const [submitted, setSubmitted]     = useState<Set<string>>(new Set());
  const [submitting, setSubmitting]   = useState<string | null>(null);
  const [loadingExist, setLoadingEx]  = useState(false);
  const [toast, setToast]             = useState<{msg:string;ok:boolean}|null>(null);

  // ── Results tab state (admin) ────────────────────────────────────────
  const [results, setResults]         = useState<ResultEntry[]>([]);
  const [loadingResults, setLoadingRes] = useState(false);
  const [expandedId, setExpandedId]   = useState<string|null>(null);
  const [filterDept, setFilterDept]   = useState<string>("ALL");

  // Fetch dept members
  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    fetch(`/api/motm/members?department=${dept}`)
      .then(r => r.json())
      .then((data: Member[]) => setTargets(data.filter(m => m.id !== myId)))
      .finally(() => setLoading(false));
  }, [dept, myId]);

  // Fetch existing ratings for rate tab
  const fetchExisting = useCallback(async () => {
    setLoadingEx(true);
    try {
      const res = await fetch(`/api/motm/rate?month=${selMonth+1}&year=${selYear}`);
      const data: ExistingRating[] = await res.json();
      const map: Record<string, Scores> = {};
      const done = new Set<string>();
      for (const r of data) {
        try {
          const p = JSON.parse(r.feedback_text);
          if (p.q1) { map[r.target_id] = p; done.add(r.target_id); }
        } catch { /* skip */ }
      }
      setRatingsMap(map);
      setSubmitted(done);
    } finally { setLoadingEx(false); }
  }, [selMonth, selYear]);

  // Fetch results for admin tab
  const fetchResults = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingRes(true);
    try {
      const res = await fetch(`/api/motm/results?month=${selMonth+1}&year=${selYear}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally { setLoadingRes(false); }
  }, [isAdmin, selMonth, selYear]);

  useEffect(() => { fetchExisting(); }, [fetchExisting]);
  useEffect(() => { if (activeTab === "results") fetchResults(); }, [activeTab, fetchResults]);

  function setScore(targetId: string, key: keyof Scores, val: number) {
    setRatingsMap(prev => ({ ...prev, [targetId]: { ...(prev[targetId] ?? EMPTY), [key]: val } }));
  }

  async function submitRating(target: Member) {
    const scores = ratingsMap[target.id];
    if (!scores || Object.values(scores).some(v => v === 0)) {
      showToast("Isi semua 5 pertanyaan terlebih dahulu.", false);
      return;
    }
    setSubmitting(target.id);
    try {
      const res = await fetch("/api/motm/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: target.id, month: selMonth+1, year: selYear, scores }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(prev => new Set([...prev, target.id]));
      showToast(`Rating ${target.name.split(" ")[0]} tersimpan ✓`, true);
    } catch {
      showToast("Gagal menyimpan, coba lagi.", false);
    } finally { setSubmitting(null); }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function avg(scores: Scores) {
    const vals = Object.values(scores).filter(v => v > 0);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  }

  const totalDone = submitted.size;
  const totalTarget = targets.length;

  const DEPTS = ["ALL","INTI","MI","MP","SD","SI"];
  const filteredResults = filterDept === "ALL"
    ? results
    : results.filter(r => r.department === filterDept);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast"
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            style={{ background: toast.ok ? "linear-gradient(135deg,#22C55E,#16A34A)" : "linear-gradient(135deg,#DC143C,#8B0000)" }}
          >
            {toast.ok ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            MOTM{" "}
            <span style={{
              background:"linear-gradient(135deg,#D4AF37,#F5D76E)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            }}>Rating</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evaluasi kinerja anggota departemen · skala Likert 1–5
          </p>
        </div>

        {/* Month picker */}
        <div className="relative">
          <button
            onClick={() => setShowMonths(v => !v)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
            style={{ background:"rgba(212,175,55,0.10)", border:"1px solid rgba(212,175,55,0.25)", color:"#D4AF37" }}
          >
            <Trophy size={14}/>
            {MONTHS[selMonth]} {selYear}
            <ChevronDown size={13} className={`transition-transform ${showMonths?"rotate-180":""}`}/>
          </button>
          <AnimatePresence>
            {showMonths && (
              <motion.div
                initial={{ opacity:0, y:-8, scale:0.96 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-8, scale:0.96 }}
                className="absolute right-0 top-12 z-30 grid grid-cols-3 gap-1 rounded-2xl p-2 shadow-2xl"
                style={{ background:"#0D0D14", border:"1px solid rgba(255,255,255,0.10)", width:220 }}
              >
                {MONTHS.map((m, i) => (
                  <button key={m} onClick={() => { setSelMonth(i); setShowMonths(false); }}
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold transition-all"
                    style={i === selMonth
                      ? { background:"#D4AF37", color:"#000" }
                      : { color:"var(--muted-foreground)", background:"transparent" }}
                  >{m.slice(0,3)}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tabs (Admin only sees both, user only sees Rate) ── */}
      {isAdmin && (
        <div className="flex gap-2">
          {[
            { id:"rate",    label:"Beri Rating",   icon:Star       },
            { id:"results", label:"Lihat Hasil",   icon:BarChart3  },
          ].map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id as "rate"|"results")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id
                ? { background:"rgba(212,175,55,0.15)", color:"#D4AF37", border:"1px solid rgba(212,175,55,0.35)" }
                : { background:"rgba(255,255,255,0.03)", color:"var(--muted-foreground)", border:"1px solid rgba(255,255,255,0.07)" }}
            >
              <tab.icon size={15}/>{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: BERI RATING
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "rate" && (
        <div className="space-y-5">
          {/* Identity chip */}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background:`${deptColor}09`, border:`1px solid ${deptColor}25` }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
              style={{ background:deptColor }}>
              {myName.split(" ").slice(0,2).map(n=>n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{myName}</p>
              <p className="text-xs text-muted-foreground">Departemen {dept} · {MONTHS[selMonth]} {selYear}</p>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-lg font-black" style={{ color:deptColor }}>{totalDone}/{totalTarget}</p>
                <p className="text-[10px] text-muted-foreground">selesai</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div className="h-full rounded-full"
              animate={{ width: totalTarget ? `${(totalDone/totalTarget)*100}%` : "0%" }}
              transition={{ duration:0.5 }}
              style={{ background:`linear-gradient(90deg,${deptColor}80,${deptColor})` }}
            />
          </div>

          {/* Loading existing notice */}
          {loadingExist && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin"/> Memuat penilaian sebelumnya...
            </div>
          )}

          {/* Target cards */}
          {loadingTargets ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 size={18} className="animate-spin"/> Memuat anggota departemen...
            </div>
          ) : targets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Users size={36} className="opacity-30"/>
              <p className="text-sm">Tidak ada anggota lain di departemenmu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {targets.map((target, idx) => {
                const scores  = ratingsMap[target.id] ?? EMPTY;
                const isDone  = submitted.has(target.id);
                const isSub   = submitting === target.id;
                const filled  = Object.values(scores).filter(v=>v>0).length;
                const avgVal  = avg(scores);

                return (
                  <motion.div key={target.id}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:idx*0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: isDone ? `1px solid ${deptColor}40` : "1px solid rgba(255,255,255,0.08)",
                      background: isDone ? `${deptColor}06` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-5 py-4"
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background:deptColor }}>
                        {target.name.split(" ").slice(0,2).map(n=>n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{target.name}</p>
                        <p className="text-xs text-muted-foreground">{target.nim}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {avgVal > 0 && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:`${deptColor}15`, color:deptColor, border:`1px solid ${deptColor}30` }}>
                            <Star size={11} style={{ fill:deptColor, color:deptColor }}/> {avgVal.toFixed(1)}
                          </span>
                        )}
                        {isDone && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:"#22C55E15", color:"#22C55E", border:"1px solid #22C55E30" }}>
                            <CheckCircle2 size={11}/> Selesai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="px-5 py-5 space-y-5">
                      {QUESTIONS.map(q => (
                        <div key={q.key} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background:q.color }}/>
                            <div>
                              <p className="text-xs font-bold text-foreground">{q.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{q.question}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-4">
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMin}</span>
                            <StarRating value={scores[q.key]} onChange={v => setScore(target.id, q.key, v)}
                              color={q.color} disabled={isDone}/>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMax}</span>
                          </div>
                        </div>
                      ))}

                      {/* Submit row */}
                      <div className="flex items-center justify-between pt-3"
                        style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-xs">
                          {filled === 5
                            ? <span className="text-[#22C55E] font-semibold">✓ Siap disimpan</span>
                            : <span className="text-muted-foreground">{filled}/5 terisi</span>}
                        </p>
                        <button onClick={() => submitRating(target)}
                          disabled={isDone || isSub || filled < 5}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            background: isDone ? "#22C55E"
                              : filled === 5 ? `linear-gradient(135deg,${deptColor},${deptColor}aa)`
                              : "rgba(255,255,255,0.06)",
                            boxShadow: filled===5&&!isDone ? `0 4px 16px ${deptColor}40` : "none",
                          }}>
                          {isSub ? <><Loader2 size={13} className="animate-spin"/> Menyimpan...</>
                            : isDone ? <><CheckCircle2 size={13}/> Tersimpan</>
                            : <><Trophy size={13}/> Simpan</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* All done */}
          {totalDone === totalTarget && totalTarget > 0 && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              className="flex flex-col items-center gap-3 rounded-2xl py-10 text-center"
              style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.20)" }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background:"rgba(212,175,55,0.15)", border:"1px solid rgba(212,175,55,0.30)" }}>
                <Trophy size={26} style={{ color:"#D4AF37" }}/>
              </div>
              <p className="text-lg font-black text-[#D4AF37]">Semua Penilaian Selesai! 🎉</p>
              <p className="text-sm text-muted-foreground">
                {MONTHS[selMonth]} {selYear} · Departemen {dept}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB: HASIL RATING (admin only)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "results" && isAdmin && (
        <div className="space-y-5">
          {/* Dept filter */}
          <div className="flex flex-wrap gap-2">
            {DEPTS.map(d => {
              const col = d === "ALL" ? "#DC143C" : DEPT_COLORS[d];
              const isAct = filterDept === d;
              return (
                <button key={d} onClick={() => setFilterDept(d)}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
                  style={isAct
                    ? { background:col, color:"#fff", boxShadow:`0 0 14px ${col}50` }
                    : { background:"rgba(255,255,255,0.04)", color:"var(--muted-foreground)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {d === "ALL" ? "Semua Dept" : d}
                </button>
              );
            })}
            <button onClick={fetchResults}
              className="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
              ↻ Refresh
            </button>
          </div>

          {loadingResults ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 size={22} className="animate-spin"/> Memuat hasil rating...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground rounded-2xl"
              style={{ background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)" }}>
              <BarChart3 size={36} className="opacity-30"/>
              <p className="text-sm">Belum ada data rating untuk {MONTHS[selMonth]} {selYear}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((r, i) => {
                const col = DEPT_COLORS[r.department] ?? "#DC143C";
                const isExp = expandedId === r.id;
                const stars = Math.round(r.avgScore);
                return (
                  <motion.div key={r.id}
                    initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:i*0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ border:`1px solid ${col}25`, background:`${col}05` }}>

                    {/* Row header */}
                    <button className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      onClick={() => setExpandedId(isExp ? null : r.id)}>
                      {/* Rank */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-sm"
                        style={{ background: i===0?"#D4AF37": i===1?"#C0C0C0": i===2?"#CD7F32":"rgba(255,255,255,0.06)",
                                 color: i<3?"#000":"var(--muted-foreground)" }}>
                        {i+1}
                      </div>
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background:col }}>
                        {r.name.split(" ").slice(0,2).map(n=>n[0]).join("")}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] rounded-md px-1.5 py-0.5 font-bold"
                            style={{ background:`${col}18`, color:col }}>{r.department}</span>
                          <span className="text-xs text-muted-foreground">{r.raterCount} penilaian</span>
                        </div>
                      </div>
                      {/* Score */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s=>(
                            <Star key={s} size={14} style={{
                              color: s<=stars ? "#D4AF37":"rgba(255,255,255,0.10)",
                              fill:  s<=stars ? "#D4AF37":"transparent",
                            }}/>
                          ))}
                        </div>
                        <span className="text-xl font-black" style={{ color:col }}>
                          {r.avgScore.toFixed(2)}
                        </span>
                      </div>
                      <ChevronDown size={15} className={`shrink-0 text-muted-foreground transition-transform ${isExp?"rotate-180":""}`}/>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ height:0, opacity:0 }}
                          animate={{ height:"auto", opacity:1 }}
                          exit={{ height:0, opacity:0 }}
                          transition={{ duration:0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-3"
                            style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 pt-3">
                              Breakdown per Metrik
                            </p>
                            {QUESTIONS.map((q,qi)=>{
                              const vals = [r.q1Avg,r.q2Avg,r.q3Avg,r.q4Avg,r.q5Avg];
                              return (
                                <div key={q.key} className="grid grid-cols-[1fr_160px] items-center gap-3">
                                  <div>
                                    <p className="text-xs font-semibold text-foreground">{Q_LABELS[qi]}</p>
                                    <p className="text-[10px] text-muted-foreground">{q.title}</p>
                                  </div>
                                  <ScoreBar value={vals[qi]} color={q.color}/>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
