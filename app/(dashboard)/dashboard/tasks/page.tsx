"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckCircle2, Circle, Trash2, ListTodo,
  AlertCircle, Loader2, Calendar, Filter,
  ChevronRight, Sparkles, AlertTriangle,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
}

const PRIORITY_COLORS = {
  low:    { text: "#22C55E", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)", icon: "🟢" },
  medium: { text: "#D4AF37", bg: "rgba(212,175,55,0.12)",  border: "rgba(212,175,55,0.25)", icon: "🟡" },
  high:   { text: "#DC143C", bg: "rgba(220,20,60,0.12)",   border: "rgba(220,20,60,0.25)", icon: "🔴" },
};

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  
  // New Task form state
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Gagal memuat tugas");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      showToast("Gagal memuat daftar tugas", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, priority: newPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTasks([data, ...tasks]);
      setNewTitle("");
      setNewPriority("medium");
      showToast("Tugas berhasil ditambahkan", true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const newStatus = !task.is_completed;
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: newStatus } : t));
      
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, is_completed: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch (err) {
      showToast("Gagal memperbarui tugas", false);
      fetchTasks(); // Revert
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setTasks(tasks.filter(t => t.id !== id));
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Tugas dihapus", true);
    } catch (err) {
      showToast("Gagal menghapus tugas", false);
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === "active") return !t.is_completed;
    if (filter === "completed") return t.is_completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.is_completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* ── Toast ── */}
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

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C]">
              <ListTodo size={24} />
            </div>
            <span>Personal <span style={{ background: "linear-gradient(135deg,#DC143C,#D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Tasks</span></span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#D4AF37]" />
            Kelola tugas harian dan target pribadimu secara privat.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3 rounded-2xl p-2 px-4 bg-white/5 border border-white/10 shrink-0">
          <div className="text-center px-3 border-r border-white/10">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-xl font-black text-foreground">{tasks.length}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Aktif</p>
            <p className="text-xl font-black text-[#D4AF37]">{activeCount}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Add Form ── */}
      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleAddTask}
        className="relative group p-1 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}
      >
        <div className="relative z-10 bg-[#0D0D14] rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Apa yang ingin kamu kerjakan hari ini?"
              className="w-full bg-transparent border-none outline-none text-base font-semibold placeholder:text-muted-foreground/30 px-2"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setNewPriority(p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                  newPriority === p ? "bg-white/10 border-white/20" : "bg-transparent border-transparent text-muted-foreground/50 hover:bg-white/5"
                }`}
                style={{ color: newPriority === p ? PRIORITY_COLORS[p].text : undefined }}
              >
                <span className="text-xs">{PRIORITY_COLORS[p].icon}</span>
                {p}
              </button>
            ))}
            
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-30 shrink-0 ml-auto"
              style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 6px 20px rgba(220,20,60,0.3)" }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
              Tambah
            </button>
          </div>
        </div>
      </motion.form>

      {/* ── Filters & List ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === f ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-4 text-[#DC143C]" />
            <p className="text-sm font-medium">Sinkronisasi tugas...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-white/10 bg-white/2"
          >
            <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-2xl bg-white/5 text-muted-foreground/30">
              <ListTodo size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {filter === "all" ? "Mulai harimu dengan list!" : filter === "completed" ? "Belum ada tugas selesai" : "Semua tugas beres!"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-[240px]">
              Tulis tugasmu dan tetap produktif sebagai anggota MTO 25/26.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <div className="space-y-3">
              {filteredTasks.map((task, idx) => {
                const cfg = PRIORITY_COLORS[task.priority];
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
                      task.is_completed ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task)}
                        className={`shrink-0 transition-transform active:scale-90 ${task.is_completed ? "text-[#22C55E]" : "text-muted-foreground/30 hover:text-foreground/50"}`}
                      >
                        {task.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate transition-all ${task.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border"
                            style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40 italic">
                            Dibuat pada {new Date(task.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-[#DC143C] hover:bg-[#DC143C]/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer Quote ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 pt-10"
      >
        <AlertTriangle size={14} className="text-muted-foreground/30" />
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
          Focus on being productive, not busy.
        </p>
      </motion.div>

    </div>
  );
}
