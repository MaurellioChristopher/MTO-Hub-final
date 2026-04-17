"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, ShieldCheck, PieChart, Receipt, RotateCcw
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  nim: string;
  department: string;
  role: string;
}

interface Payment {
  user_id: string;
  month: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
const KAS_AMOUNT_PER_MONTH = 7000;
const BENDAHARA_NIM = "102022430027"; // Alya Salma Khoerunisaa

const DEPT_COLORS: Record<string, string> = {
  INTI: "#DC143C",
  MI:   "#D4AF37",
  MP:   "#4F8EF7",
  SD:   "#22C55E",
  SI:   "#A855F7",
};

// ── Utils ─────────────────────────────────────────────────────────────────────
function formatRp(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KasPage() {
  const { data: session } = useSession();
  
  const isBendahara = session?.user?.nim === BENDAHARA_NIM;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Member[]>([]);
  
  // Matrix Map: `${userId}-${month}` -> boolean
  const [paymentsMap, setPaymentsMap] = useState<Record<string, boolean>>({});
  const [year] = useState(2026);

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Loading state per cell to prevent double clicks during save
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kas?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const { users: fetchedUsers, payments: fetchedPayments } = await res.json();
      
      setUsers(fetchedUsers || []);

      const newMap: Record<string, boolean> = {};
      (fetchedPayments || []).forEach((p: Payment) => {
        newMap[`${p.user_id}-${p.month}`] = true;
      });
      setPaymentsMap(newMap);
    } catch {
      showToast("Gagal memuat data kas", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Toggle Payment ──────────────────────────────────────────────────────────
  async function togglePayment(userId: string, month: number) {
    if (!isBendahara) return; // guard

    const cellKey = `${userId}-${month}`;
    if (savingCells.has(cellKey)) return;

    const currentStatus = !!paymentsMap[cellKey];
    const newStatus = !currentStatus;

    // Optimistic UI update
    setPaymentsMap((prev) => ({ ...prev, [cellKey]: newStatus }));
    setSavingCells((prev) => new Set([...prev, cellKey]));

    try {
      const res = await fetch("/api/kas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: userId, month, year, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan");
      }
    } catch {
      // Revert if failed
      setPaymentsMap((prev) => ({ ...prev, [cellKey]: currentStatus }));
      showToast("Gagal menyimpan perubahan", false);
    } finally {
      setSavingCells((prev) => {
        const next = new Set([...prev]);
        next.delete(cellKey);
        return next;
      });
    }
  }

  // ── Computations ────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  const totalTerkumpul = useMemo(() => {
    return Object.values(paymentsMap).filter(Boolean).length * KAS_AMOUNT_PER_MONTH;
  }, [paymentsMap]);

  // Target total = 33 members * 12 months * 7000 Rp
  const targetTerkumpul = users.length * 12 * KAS_AMOUNT_PER_MONTH;
  const progressPercent = targetTerkumpul > 0 ? (totalTerkumpul / targetTerkumpul) * 100 : 0;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-10">
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            style={{
              background: toast.ok
                ? "linear-gradient(135deg,#22C55E,#16A34A)"
                : "linear-gradient(135deg,#DC143C,#8B0000)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Wallet size={24} className="text-[#22C55E]" />
            Uang{" "}
            <span style={{
              background: "linear-gradient(135deg,#22C55E,#16A34A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Kas MTO
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            Tagihan kas bulanan periode {year}
            {isBendahara && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#F5D76E] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                <ShieldCheck size={11} /> Akses Bendahara Aktif
              </span>
            )}
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex gap-3">
          <div className="flex flex-col rounded-2xl p-4 min-w-[200px]"
            style={{ background: "#22C55E0C", border: "1px solid #22C55E25" }}>
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#22C55E]">Total Terkumpul</p>
              <Receipt size={14} className="text-[#22C55E]" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {formatRp(totalTerkumpul)}
            </p>
            <div className="mt-2.5">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #22C55E, #4ADE80)" }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {progressPercent.toFixed(1)}% dari target {formatRp(targetTerkumpul)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari anggota atau departemen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all outline-none focus:ring-2 focus:ring-[#22C55E]/50"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-white/5 disabled:opacity-50"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* ── Main Matrix UI ── */}
      <div 
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #111116 0%, #0A0A0F 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-3 text-[#22C55E]" />
            <p className="text-sm font-medium">Memuat rekapan kas MTO...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search size={32} className="opacity-30 mb-3" />
            <p className="text-sm font-medium">Tidak ada anggota yang cocok dengan pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 py-4 px-5 text-[11px] font-black uppercase tracking-widest text-muted-foreground bg-[#0D0D14]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                    Anggota
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="py-4 px-2 text-[10px] font-bold text-center text-muted-foreground w-[48px]"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {m}
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 py-4 px-6 text-[11px] font-black tracking-widest text-[#22C55E] text-right bg-[#0D0D14]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                    TOTAL
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const deptColor = DEPT_COLORS[user.department] || "#FFF";
                  
                  // Compute user total
                  let userPaidMonths = 0;
                  for (let m = 1; m <= 12; m++) {
                    if (paymentsMap[`${user.id}-${m}`]) userPaidMonths++;
                  }
                  const userTotalRp = userPaidMonths * KAS_AMOUNT_PER_MONTH;
                  const isComplete = userPaidMonths === 12;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Name Column (Sticky) */}
                      <td className="sticky left-0 z-10 py-3 px-5 bg-[#0D0D14] group-hover:bg-[#12121A] transition-colors"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            borderRight: "1px solid rgba(255,255,255,0.04)"
                          }}>
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-right text-[10px] font-bold text-muted-foreground/30">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate max-w-[160px]">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                                    style={{ background: `${deptColor}15`, color: deptColor }}>
                                {user.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 12 Months Checkboxes */}
                      {MONTHS.map((_, mIdx) => {
                        const monthNum = mIdx + 1;
                        const cellKey = `${user.id}-${monthNum}`;
                        const isPaid = !!paymentsMap[cellKey];
                        const isSaving = savingCells.has(cellKey);

                        return (
                          <td key={monthNum} className="py-2.5 px-2 text-center"
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                            <button
                              onClick={() => togglePayment(user.id, monthNum)}
                              disabled={!isBendahara || isSaving}
                              className={`
                                relative flex items-center justify-center w-7 h-7 mx-auto rounded-[6px] transition-all duration-300
                                ${isBendahara ? (isPaid ? "cursor-pointer" : "cursor-pointer hover:bg-white/10") : "cursor-default"}
                              `}
                              style={{
                                background: isPaid 
                                  ? "linear-gradient(135deg, #22C55E, #16A34A)" 
                                  : "rgba(255,255,255,0.03)",
                                border: isPaid 
                                  ? "1px solid #4ADE80" 
                                  : "1px solid rgba(255,255,255,0.1)",
                                boxShadow: isPaid ? "0 0 12px rgba(34,197,94,0.4)" : "none",
                                opacity: isSaving ? 0.5 : 1
                              }}
                            >
                              {isSaving ? (
                                <Loader2 size={12} className="animate-spin text-white" />
                              ) : isPaid ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                  <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                                </motion.div>
                              ) : null}

                              {/* Tooltip on hover (optional) */}
                              {isBendahara && !isPaid && !isSaving && (
                                <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 rounded-[6px]" />
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Column (Sticky) */}
                      <td className="sticky right-0 z-10 py-3 px-6 bg-[#0D0D14] group-hover:bg-[#12121A] transition-colors text-right"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            borderLeft: "1px solid rgba(255,255,255,0.04)"
                          }}>
                        {userPaidMonths === 0 ? (
                          <span className="text-xs font-semibold text-muted-foreground/30">-</span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black" style={{ color: isComplete ? "#22C55E" : "#FFF" }}>
                              {formatRp(userTotalRp)}
                            </span>
                            {isComplete && (
                              <span className="text-[9px] font-bold text-[#22C55E] uppercase tracking-wider mt-0.5 bg-[#22C55E]/10 px-1.5 py-0.5 rounded">
                                Lunas
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
