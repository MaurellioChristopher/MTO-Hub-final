"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Trash2,
  Upload,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  FileBadge,
  ImageIcon,
  AlertCircle,
  Send,
  RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Perizinan {
  id: string;
  nama: string;
  nim: string;
  jurusan: string;
  divisi: string;
  keterangan: string;
  status: "pending" | "approved" | "rejected";
  buktiUrl?: string;
  buktiNama?: string;
  createdAt: string;
}

const JURUSAN_OPTIONS = [
  "Teknik Industri",
  "Sistem Informasi",
  "Teknik Logistik",
];

const DIVISI_OPTIONS = [
  "INTI",
  "MI",
  "MP",
  "SD",
  "SI",
];

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    icon: Clock,
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.12)",
    border: "rgba(212,175,55,0.3)",
  },
  approved: {
    label: "Disetujui",
    icon: CheckCircle,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.3)",
  },
  rejected: {
    label: "Ditolak",
    icon: XCircle,
    color: "#FF3B30",
    bg: "rgba(255,59,48,0.12)",
    border: "rgba(255,59,48,0.3)",
  },
};

export default function PerizinanPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nama: "",
    nim: "",
    jurusan: "",
    divisi: "",
    keterangan: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [list, setList] = useState<Perizinan[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "Admin";

  // Prefill from session
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        nama: session.user.name ?? "",
        divisi: (session.user as any).department ?? "",
      }));
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus perizinan ini?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/perizinan?id=${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const res = await fetch("/api/perizinan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status } : p))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/perizinan");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nama || !form.nim || !form.jurusan || !form.divisi || !form.keterangan) {
      setError("Semua field wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("bukti", file);

      const res = await fetch("/api/perizinan", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? "Gagal submit");

      setSuccess(true);
      setForm((prev) => ({ ...prev, keterangan: "" }));
      setFile(null);
      setFilePreview(null);
      fetchList();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(220,20,60,0.15)", border: "1px solid rgba(220,20,60,0.3)" }}
        >
          <FileBadge size={20} className="text-[#DC143C]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Form Perizinan</h1>
          <p className="text-xs text-muted-foreground">Ajukan izin tidak hadir kegiatan MTO</p>
        </div>
      </motion.div>

      {/* Layout: Form kiri + List kanan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── FORM (kiri, 2/5) ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            }}
          >
            <p className="mb-5 text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText size={15} className="text-[#DC143C]" />
              Data Pengajuan Izin
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama */}
              <FormField label="Nama Lengkap" required>
                <input
                  id="perizinan-nama"
                  type="text"
                  placeholder="Nama lengkap kamu"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="input-mto"
                />
              </FormField>

              {/* NIM */}
              <FormField label="NIM" required>
                <input
                  id="perizinan-nim"
                  type="text"
                  placeholder="Nomor Induk Mahasiswa"
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  className="input-mto"
                />
              </FormField>

              {/* Jurusan */}
              <FormField label="Jurusan" required>
                <select
                  id="perizinan-jurusan"
                  value={form.jurusan}
                  onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                  className="input-mto"
                >
                  <option value="">Pilih Jurusan</option>
                  {JURUSAN_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </FormField>

              {/* Divisi */}
              <FormField label="Divisi" required>
                <select
                  id="perizinan-divisi"
                  value={form.divisi}
                  onChange={(e) => setForm({ ...form, divisi: e.target.value })}
                  className="input-mto"
                >
                  <option value="">Pilih Divisi</option>
                  {DIVISI_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </FormField>

              {/* Keterangan */}
              <FormField label="Keterangan Izin" required>
                <textarea
                  id="perizinan-keterangan"
                  placeholder="Jelaskan alasan izin kamu..."
                  rows={3}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="input-mto resize-none"
                />
              </FormField>

              {/* Upload Bukti */}
              <FormField label="Bukti (PDF / Gambar)">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  id="perizinan-upload-zone"
                  className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-center transition-all duration-200 hover:border-[#DC143C]/50 hover:bg-white/[0.02]"
                  style={{ borderColor: file ? "rgba(220,20,60,0.5)" : "rgba(255,255,255,0.1)" }}
                >
                  {filePreview ? (
                    <img src={filePreview} alt="preview" className="max-h-28 rounded-lg object-contain" />
                  ) : file ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileText size={28} className="text-[#DC143C]" />
                      <p className="max-w-[180px] truncate text-xs text-foreground">{file.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={22} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Drag & drop atau <span className="text-[#DC143C] font-medium">klik untuk upload</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">PDF, JPG, PNG (maks. 5MB)</p>
                    </>
                  )}

                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(null); }}
                      className="absolute right-2 top-2 rounded-full bg-black/40 p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </FormField>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive"
                    style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)" }}
                  >
                    <AlertCircle size={13} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-green-400"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                  >
                    <CheckCircle size={13} />
                    Perizinan berhasil diajukan!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                id="perizinan-submit"
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #DC143C 0%, #8B0000 100%)",
                  boxShadow: "0 4px 14px rgba(220,20,60,0.35)",
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Mengirim..." : "Ajukan Izin"}
              </button>
            </form>
          </div>
        </motion.div>

        {/* ── LIST (kanan, 3/5) ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3"
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock size={15} className="text-[#D4AF37]" />
                Riwayat Perizinan
              </p>
              <button
                id="perizinan-refresh"
                onClick={fetchList}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <RefreshCw size={14} className={loadingList ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingList ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                <FileBadge size={36} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Belum ada pengajuan izin</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {list.map((item, idx) => {
                    const cfg = STATUS_CONFIG[item.status];
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{item.nama}</p>
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ background: "rgba(220,20,60,0.15)", color: "#FF4D6D" }}
                              >
                                {item.divisi}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.nim} · {item.jurusan}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.keterangan}</p>

                            {item.buktiNama && (
                              <div className="mt-2 flex items-center gap-1.5">
                                {item.buktiNama.endsWith(".pdf") ? (
                                  <FileText size={12} className="text-[#DC143C]" />
                                ) : (
                                  <ImageIcon size={12} className="text-[#DC143C]" />
                                )}
                                {isAdmin && item.buktiUrl ? (
                                  <a
                                    href={item.buktiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`perizinan-bukti-${item.id}`}
                                    className="text-[10px] truncate max-w-[180px] text-[#DC143C] underline underline-offset-2 hover:text-[#FF4D6D] transition-colors"
                                  >
                                    {item.buktiNama}
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                    {item.buktiNama}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                color: cfg.color,
                              }}
                            >
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                            {isAdmin && item.status === "pending" && (
                              <div className="flex gap-1.5">
                                <button
                                  id={`perizinan-approve-${item.id}`}
                                  onClick={() => handleUpdateStatus(item.id, "approved")}
                                  disabled={updating === item.id}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-green-400 hover:bg-green-400/10 transition-all disabled:opacity-50"
                                  style={{ border: "1px solid rgba(34,197,94,0.3)" }}
                                >
                                  {updating === item.id
                                    ? <Loader2 size={10} className="animate-spin" />
                                    : <CheckCircle size={10} />}
                                  Setujui
                                </button>
                                <button
                                  id={`perizinan-reject-${item.id}`}
                                  onClick={() => handleUpdateStatus(item.id, "rejected")}
                                  disabled={updating === item.id}
                                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                                  style={{ border: "1px solid rgba(255,59,48,0.3)" }}
                                >
                                  {updating === item.id
                                    ? <Loader2 size={10} className="animate-spin" />
                                    : <XCircle size={10} />}
                                  Tolak
                                </button>
                              </div>
                            )}
                            {isAdmin && (
                              <button
                                id={`perizinan-delete-${item.id}`}
                                onClick={() => handleDelete(item.id)}
                                disabled={deleting === item.id}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                              >
                                {deleting === item.id
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Trash2 size={11} />}
                                Hapus
                              </button>
                            )}
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-[#DC143C]">*</span>}
      </label>
      {children}
    </div>
  );
}
