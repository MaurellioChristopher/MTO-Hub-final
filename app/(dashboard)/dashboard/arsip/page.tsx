"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderArchive, UploadCloud, FileText, FileImage, File,
  Download, Trash2, X, Plus, Search, Filter, CheckCircle2,
  AlertCircle, Loader2, Calendar, User, HardDrive, Tag,
  FileSpreadsheet, Presentation,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Berkas {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  uploader_name: string;
  uploader_dept: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["Semua", "Umum", "Proposal Proker", "Surat Menyurat", "Keuangan", "Lainnya"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Umum":            { bg: "rgba(99,102,241,0.15)",  text: "#818CF8", border: "rgba(99,102,241,0.3)"  },
  "Proposal Proker": { bg: "rgba(220,20,60,0.15)",   text: "#F87171", border: "rgba(220,20,60,0.3)"   },
  "Surat Menyurat":  { bg: "rgba(212,175,55,0.15)",  text: "#FACC15", border: "rgba(212,175,55,0.3)"  },
  "Keuangan":        { bg: "rgba(34,197,94,0.15)",   text: "#4ADE80", border: "rgba(34,197,94,0.3)"   },
  "Lainnya":         { bg: "rgba(148,163,184,0.15)", text: "#94A3B8", border: "rgba(148,163,184,0.3)" },
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getFileIcon(fileType: string, size = 28) {
  if (fileType.includes("pdf"))
    return <FileText size={size} className="text-red-400" />;
  if (fileType.startsWith("image/"))
    return <FileImage size={size} className="text-blue-400" />;
  if (fileType.includes("word") || fileType.includes("document"))
    return <FileText size={size} className="text-sky-400" />;
  if (fileType.includes("sheet") || fileType.includes("excel"))
    return <FileSpreadsheet size={size} className="text-green-400" />;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return <Presentation size={size} className="text-orange-400" />;
  return <File size={size} className="text-muted-foreground" />;
}

function getFileBadgeStyle(fileType: string): { bg: string; text: string } {
  if (fileType.includes("pdf"))        return { bg: "rgba(239,68,68,0.15)",   text: "#F87171" };
  if (fileType.startsWith("image/"))   return { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA" };
  if (fileType.includes("word") || fileType.includes("document"))
                                       return { bg: "rgba(14,165,233,0.15)",  text: "#38BDF8" };
  if (fileType.includes("sheet") || fileType.includes("excel"))
                                       return { bg: "rgba(34,197,94,0.15)",   text: "#4ADE80" };
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
                                       return { bg: "rgba(249,115,22,0.15)",  text: "#FB923C" };
  return { bg: "rgba(148,163,184,0.15)", text: "#94A3B8" };
}

function getFileExt(name: string) {
  return name.split(".").pop()?.toUpperCase() || "FILE";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ArsipBerkasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";

  const [berkas, setBerkas]         = useState<Berkas[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload form
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc]   = useState("");
  const [uploadCat, setUploadCat]     = useState("Umum");
  const [submitting, setSubmitting]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchBerkas = async (cat?: string) => {
    setLoading(true);
    try {
      const catParam = cat ?? activeCategory;
      const url = catParam === "Semua" ? "/api/arsip" : `/api/arsip?category=${encodeURIComponent(catParam)}`;
      const res = await fetch(url);
      const data = await res.json();
      setBerkas(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat arsip berkas.", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerkas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Filtered by search ────────────────────────────────────────────────────
  const filtered = berkas.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.file_name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.uploader_name.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      showToast("Ukuran file maksimal 20MB", false);
      return;
    }
    setUploadFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { showToast("Maksimal 20MB", false); return; }
    setUploadFile(f);
  };

  const resetForm = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDesc("");
    setUploadCat("Umum");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      showToast("Judul dan file wajib diisi", false);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", uploadTitle.trim());
      fd.append("description", uploadDesc.trim());
      fd.append("category", uploadCat);

      const res = await fetch("/api/arsip", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal upload");

      showToast("✅ Berkas berhasil diarsipkan!", true);
      setModalOpen(false);
      resetForm();
      fetchBerkas();
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus berkas ini secara permanen?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/arsip?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus berkas");
      showToast("Berkas berhasil dihapus.", true);
      setBerkas((prev) => prev.filter((b) => b.id !== id));
    } catch {
      showToast("Terjadi kesalahan saat menghapus.", false);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
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
            <FolderArchive size={26} className="text-[#DC143C]" />
            Arsip{" "}
            <span
              style={{
                background: "linear-gradient(135deg,#DC143C,#D4AF37)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Berkas
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Repositori dokumen resmi organisasi MTO — proposal, surat, dan berkas lainnya.
          </p>

          {/* Stats strip */}
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { label: "Total Berkas", value: berkas.length },
              { label: "Kategori", value: CATEGORIES.length - 1 },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(220,20,60,0.08)", border: "1px solid rgba(220,20,60,0.2)" }}
              >
                <span className="text-[#DC143C]">{s.value}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            id="btn-upload-berkas"
            className="group flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg,#DC143C,#8B0000)",
              boxShadow: "0 8px 32px rgba(220,20,60,0.3)",
            }}
          >
            <Plus size={18} className="transition-transform group-hover:rotate-90" />
            Unggah Berkas
          </button>
        )}
      </div>

      {/* ── Search + Filter Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div
          className="relative flex-1"
        >
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, nama file, atau uploader..."
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all border border-white/10 bg-white/5 focus:border-[#DC143C]/50 focus:bg-white/8 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const style = cat !== "Semua" ? CATEGORY_COLORS[cat] : null;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSearch(""); }}
                className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: cat === "Semua" ? "rgba(220,20,60,0.2)" : style?.bg,
                        color: cat === "Semua" ? "#DC143C" : style?.text,
                        border: `1px solid ${cat === "Semua" ? "rgba(220,20,60,0.4)" : style?.border}`,
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.45)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
              onClick={() => !submitting && setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{
                background: "#0D0D14",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="text-[#DC143C]" size={22} />
                  Unggah Berkas Baru
                </h2>
                <button
                  onClick={() => !submitting && setModalOpen(false)}
                  disabled={submitting}
                  className="rounded-full p-1.5 hover:bg-white/10 text-muted-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => !submitting && fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[140px]"
                  style={
                    uploadFile
                      ? { borderColor: "rgba(220,20,60,0.6)", background: "rgba(220,20,60,0.05)" }
                      : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }
                  }
                >
                  {uploadFile ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none">
                      {getFileIcon(uploadFile.type, 36)}
                      <p className="text-sm font-semibold text-foreground max-w-[280px] truncate">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)} · Klik untuk ganti</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center pointer-events-none">
                      <UploadCloud size={36} className="text-[#DC143C] opacity-60" />
                      <p className="text-sm font-semibold text-foreground">Drag & drop atau klik untuk pilih file</p>
                      <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, Gambar (Maks 20MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_TYPES.join(",")}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>

                {/* Judul */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    <FileText size={12} /> Judul Berkas
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="cth: Proposal Proker Mabar Q1 2026"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#DC143C]/40 border border-white/10 bg-white/5"
                    disabled={submitting}
                    maxLength={200}
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    <Tag size={12} /> Kategori
                  </label>
                  <select
                    value={uploadCat}
                    onChange={(e) => setUploadCat(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#DC143C]/40 border border-white/10 bg-[#0D0D14] text-foreground"
                  >
                    {CATEGORIES.filter((c) => c !== "Semua").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    <Filter size={12} /> Deskripsi (opsional)
                  </label>
                  <textarea
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Keterangan singkat berkas ini..."
                    className="w-full h-20 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#DC143C]/40 border border-white/10 bg-white/5"
                    disabled={submitting}
                    maxLength={500}
                  />
                </div>

                <button
                  type="submit"
                  id="btn-submit-arsip"
                  disabled={submitting || !uploadFile || !uploadTitle.trim()}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-40"
                  style={{
                    background: (!uploadFile || !uploadTitle.trim())
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg,#DC143C,#8B0000)",
                    boxShadow: (!uploadFile || !uploadTitle.trim()) ? "none" : "0 4px 20px rgba(220,20,60,0.3)",
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Mengunggah...
                    </span>
                  ) : (
                    "📁 Simpan ke Arsip"
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Berkas Grid ── */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-3 text-[#DC143C]" />
            <p className="text-sm">Memuat arsip berkas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-24 text-muted-foreground rounded-3xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <FolderArchive size={48} className="opacity-20 text-[#DC143C]" />
            <div className="text-center">
              <p className="text-base font-semibold">
                {search ? `Tidak ada berkas dengan kata "${search}"` : "Arsip masih kosong"}
              </p>
              <p className="text-xs opacity-60 mt-1">
                {isAdmin && !search ? "Mulai unggah berkas resmi organisasi MTO." : "Coba kata kunci lain."}
              </p>
            </div>
            {isAdmin && !search && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 text-xs font-bold text-[#DC143C] px-4 py-2 rounded-xl bg-[#DC143C]/10 hover:bg-[#DC143C]/20 transition-colors"
              >
                Unggah Sekarang
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((b, idx) => {
              const catStyle = CATEGORY_COLORS[b.category] || CATEGORY_COLORS["Lainnya"];
              const badgeStyle = getFileBadgeStyle(b.file_type);
              const ext = getFileExt(b.file_name);
              const isDel = deletingId === b.id;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Card header — file type visual */}
                  <div
                    className="flex h-28 items-center justify-center relative overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    {/* BG glow */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{ background: `radial-gradient(circle at center, ${badgeStyle.text} 0%, transparent 70%)` }}
                    />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      {getFileIcon(b.file_type, 40)}
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-black tracking-widest"
                        style={{ background: badgeStyle.bg, color: badgeStyle.text }}
                      >
                        {ext}
                      </span>
                    </div>

                    {/* Admin delete btn */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={isDel}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/50 border border-white/10 text-white/50 hover:text-red-400 hover:bg-black/80 hover:border-red-500/40 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {isDel ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    {/* Category badge */}
                    <span
                      className="w-fit rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}
                    >
                      {b.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      {b.title}
                    </h3>

                    {/* Description (if any) */}
                    {b.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {b.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="mt-auto space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <User size={11} className="shrink-0" />
                        <span className="truncate">{b.uploader_name}</span>
                        <span className="shrink-0 text-[9px] px-1 rounded"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          {b.uploader_dept}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(b.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} />
                          {formatFileSize(b.file_size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Download button */}
                  <a
                    href={b.file_url}
                    download={b.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    id={`download-${b.id}`}
                    className="group/dl flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all duration-300"
                    style={{
                      background: "rgba(220,20,60,0.08)",
                      borderTop: "1px solid rgba(220,20,60,0.15)",
                      color: "#DC143C",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(220,20,60,0.2)";
                      e.currentTarget.style.color = "#F87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(220,20,60,0.08)";
                      e.currentTarget.style.color = "#DC143C";
                    }}
                  >
                    <Download size={14} className="transition-transform group-hover/dl:-translate-y-0.5 group-hover/dl:translate-x-0" />
                    Unduh Berkas
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
