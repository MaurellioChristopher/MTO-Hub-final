"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const STARTERS = [
  "Tanggal berapa ada proker terdekat? 📅",
  "Siapa ketua umum MTO? 👑",
  "Ada pengumuman terbaru ga? 📢",
  "Ceritain MTO dong 🤖",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-60"
        />
      ))}
    </div>
  );
}

export function MTOBot() {
  const { data: session } = useSession();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: `Halo ${session?.user?.name?.split(" ")[0] ?? "Bro"}! 👋 Aku MTOBot, asisten AI MTO 25/26.\n\nMau tanya apa nih? Soal jadwal, anggota, proker, atau hal random juga boleh wkwk 😄`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", text: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      const botReply = data.reply ?? data.error ?? "Hmm, aku bingung nih 😅";
      setMessages([...newMessages, { role: "bot", text: botReply }]);
      if (!open) setUnread((u) => u + 1);
    } catch (e: any) {
      setMessages([...newMessages, { role: "bot", text: `Koneksi error: ${e?.message ?? "unknown"} 😅` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Bubble ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              id="mtobot-open"
              className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl"
              style={{ background: "linear-gradient(135deg, #DC143C, #8B0000)", boxShadow: "0 8px 32px rgba(220,20,60,0.4)" }}
            >
              <Bot size={24} />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: "#DC143C" }} />
              {/* Unread badge */}
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-black">
                  {unread}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Chat Window ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="flex h-[520px] w-[340px] flex-col overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: "#0D0D14", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "linear-gradient(135deg, rgba(220,20,60,0.2), rgba(139,0,0,0.1))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 12px rgba(220,20,60,0.4)" }}
                >
                  <Bot size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white flex items-center gap-1.5">
                    MTOBot <Sparkles size={12} className="text-yellow-400" />
                  </p>
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                    Online • Powered by Gemini AI
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "bot" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl mt-0.5"
                        style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)" }}>
                        <Bot size={13} className="text-white" />
                      </div>
                    )}
                    <div
                      className="max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
                      style={msg.role === "user"
                        ? { background: "linear-gradient(135deg,#DC143C,#8B0000)", color: "white", borderBottomRightRadius: 4 }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }
                      }
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)" }}>
                      <Bot size={13} className="text-white" />
                    </div>
                    <div className="rounded-2xl border px-3 py-2 text-white/60"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Quick starters — only show at beginning */}
              {messages.length <= 1 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                  {STARTERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(220,20,60,0.12)", border: "1px solid rgba(220,20,60,0.25)", color: "#FF6B7A" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div
                className="px-3 py-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-end gap-2 rounded-2xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Tanya apa aja ke MTOBot..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-xs text-white outline-none placeholder:text-white/30 max-h-20"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    id="mtobot-send"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-30"
                    style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)" }}
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[9px] text-white/20">
                  MTOBot bisa salah — verifikasi info penting ke admin 😊
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
