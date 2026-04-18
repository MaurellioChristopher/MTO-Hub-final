"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2, Info, Reply, CornerDownRight, Trash2 } from "lucide-react";

interface AspirasiReply {
  id: string;
  aspirasi_id: string;
  reply_text: string;
  created_at: string;
}

interface Aspirasi {
  id: string;
  kategori: string;
  isi: string;
  created_at: string;
  replies?: AspirasiReply[];
}

export default function AspirasiPage() {
  const { data: session } = useSession();
  const [aspirasiList, setAspirasiList] = useState<Aspirasi[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State (Aspirasi)
  const [isi, setIsi] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form State ( Replies )
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchAspirasi();
  }, []);

  async function fetchAspirasi() {
    try {
      const res = await fetch("/api/aspirasi");
      if (res.ok) {
        const data = await res.json();
        setAspirasiList(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim() || isi.trim().length < 10) {
      showToast("Aspirasi harus minimal 10 karakter.", false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/aspirasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori: "Umum", isi: isi.trim() }),
      });

      if (!res.ok) throw new Error();

      showToast("Aspirasi berhasil dikirim! ✓", true);
      setIsi("");
      fetchAspirasi(); // Refresh list
    } catch {
      showToast("Gagal mengirim aspirasi, coba lagi.", false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(aspirasiId: string) {
    const text = replyInputs[aspirasiId];
    if (!text || text.trim().length === 0) return;

    if (!session) {
      showToast("Anda harus login untuk membalas", false);
      return;
    }

    setSubmittingReply(aspirasiId);
    try {
      const res = await fetch("/api/aspirasi/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspirasiId, reply: text.trim() }),
      });

      if (!res.ok) throw new Error();

      showToast("Balasan berhasil dikirim! ✓", true);
      setReplyInputs(prev => ({ ...prev, [aspirasiId]: "" }));
      setActiveReplyId(null);
      fetchAspirasi();
    } catch {
      showToast("Gagal mengirim balasan.", false);
    } finally {
      setSubmittingReply(null);
    }
  }

  async function handleDeleteAspirasi(id: string) {
    if (!window.confirm("Hapus aspirasi ini secara permanen?")) return;

    try {
      const res = await fetch(`/api/aspirasi?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Aspirasi berhasil dihapus.", true);
        fetchAspirasi();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menghapus aspirasi.", false);
      }
    } catch {
      showToast("Kesalahan sistem saat menghapus.", false);
    }
  }

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kotak{" "}
            <span style={{
              background:"linear-gradient(135deg,#4F8EF7,#60A5FA)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            }}>Aspirasi</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ruang penyampaian gagasan, masukan, dan kritik. 100% Anonim.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ── LIST ASPIRASI TAMPIL PUBLIK ── */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Aspirasi Terbaru
          </p>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Memuat aspirasi...
            </div>
          ) : aspirasiList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 rounded-2xl text-muted-foreground"
                 style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <MessageSquare size={32} className="opacity-30" />
              <p className="text-sm">Belum ada aspirasi yang disampaikan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aspirasiList.map((asp, i) => (
                <motion.div
                  key={asp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(79,142,247,0.04)",
                    border: "1px solid rgba(79,142,247,0.15)",
                  }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#4F8EF7] opacity-60" />
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#4F8EF7]/10 text-[#4F8EF7]">
                      <UserIconAnon />
                    </div>
                    <span className="text-xs font-bold text-[#4F8EF7]">Anonim</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(asp.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                    
                    {session?.user?.role === "Admin" && (
                      <button
                        onClick={() => handleDeleteAspirasi(asp.id)}
                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Hapus Aspirasi"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {asp.isi}
                  </p>

                  {/* Replies List */}
                  {asp.replies && asp.replies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      {asp.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5">
                          <CornerDownRight size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-white">Anonim</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-white/80 whitespace-pre-wrap">{reply.reply_text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Button & Input */}
                  <div className="mt-4 flex flex-col gap-2">
                    {activeReplyId !== asp.id ? (
                      <button
                        onClick={() => setActiveReplyId(asp.id)}
                        className="self-start flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition-colors"
                      >
                        <Reply size={14} /> Balas
                      </button>
                    ) : (
                      <div className="flex gap-2 items-end">
                        <textarea
                          placeholder="Tulis balasan anonim..."
                          value={replyInputs[asp.id] || ""}
                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [asp.id]: e.target.value }))}
                          className="flex-1 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all resize-none border border-white/10 bg-black/40 outline-none focus:border-white/30 min-h-[40px]"
                          disabled={submittingReply === asp.id}
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReplySubmit(asp.id)}
                            disabled={submittingReply === asp.id || !(replyInputs[asp.id]?.trim())}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                          >
                            {submittingReply === asp.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setActiveReplyId(null);
                              setReplyInputs(prev => ({ ...prev, [asp.id]: "" }));
                            }}
                            className="py-1 text-xs text-muted-foreground hover:text-red-400 text-center transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── FORM SUBMIT ANONIM ── */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#4F8EF7] mb-2">
            Tulis Aspirasimu
          </p>

          <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 text-[#4F8EF7]">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">
                Silahkan beri harapan, cita-cita, atau tujuan yang ingin dicapai di masa depan, serta penyampaian gagasan, masukan, maupun kritik untuk perbaikan MTO. Namamu tidak akan direkam.
              </p>
            </div>

            <div>
              <textarea
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan isi pikiranmu di sini..."
                disabled={submitting}
                className="w-full h-40 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all resize-none"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || isi.trim().length < 10}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #4F8EF7, #2563EB)",
                boxShadow: "0 4px 16px rgba(79,142,247,0.3)",
              }}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
              ) : (
                <><Send size={16} /> Kirim Secara Anonim</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

function UserIconAnon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
