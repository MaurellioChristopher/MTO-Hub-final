"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, UploadCloud, CheckCircle2, AlertCircle, Loader2,
  Trash2, X, Plus, Calendar, Type, Captions, Maximize2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface GalleryPost {
  id: string;
  user_id: string;
  title: string;
  caption: string;
  image_url: string;
  event_date: string;
  created_at: string;
  uploader_name: string;
  uploader_dept: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "Admin";

  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Lightbox state
  const [selectedImage, setSelectedImage] = useState<GalleryPost | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetching Data ───────────────────────────────────────────────────────────
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      showToast("Gagal memuat galeri.", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(selected.type)) {
        showToast("Hanya menerima gambar (JPG, PNG, GIF, WEBP)", false);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        showToast("Ukuran gambar maksimal 5MB", false);
        return;
      }
      setFile(selected);
      const objUrl = URL.createObjectURL(selected);
      setPreview(objUrl);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !caption.trim() || !eventDate) {
      showToast("Semua kolom harus diisi beserta gambar", false);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("caption", caption.trim());
      formData.append("eventDate", eventDate);

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: formData, // do not set Content-Type header manually for FormData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal upload");

      showToast("Kenangan berhasil diabadikan! 📸", true);
      setModalOpen(false);
      resetForm();
      fetchPosts();
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus foto ini selamanya?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus galeri");
      showToast("Foto berhasil dihapus.", true);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      showToast("Terjadi kesalahan sistem saat menghapus.", false);
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setTitle("");
    setCaption("");
    setEventDate("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <ImageIcon size={24} className="text-[#A855F7]" />
            Galeri{" "}
            <span style={{
              background: "linear-gradient(135deg,#A855F7,#E879F9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              MTO
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            Dokumentasi kenang-kenangan cerita kegiatan kita seangkatan. 
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg,#A855F7,#E879F9)",
            boxShadow: "0 8px 32px rgba(168,85,247,0.3)",
          }}
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          Tambah Kenangan
        </button>
      </div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="text-[#A855F7]" size={22} />
                  Upload Momen
                </h2>
                <button onClick={() => !submitting && setModalOpen(false)} disabled={submitting}
                  className="rounded-full p-1.5 hover:bg-white/10 text-muted-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Image Picker */}
                <div 
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all overflow-hidden cursor-pointer ${
                    preview ? 'border-transparent bg-black' : 'border-white/10 hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5'
                  }`}
                  style={{ minHeight: "220px" }}
                  onClick={() => !submitting && fileInputRef.current?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-6 pointer-events-none">
                      <ImageIcon size={40} className="mx-auto mb-3 opacity-30 text-[#A855F7]" />
                      <p className="text-sm font-semibold text-foreground">Klik untuk pilih gambar</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (Maks 5MB)</p>
                    </div>
                  )}
                  {preview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <p className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md">Ganti Gambar</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                </div>

                {/* Metadata */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    <Type size={12}/> Judul Lucu / Acara
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Panik sebelum acara mulai 🏃‍♂️"
                    className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#A855F7]/50 border border-white/10 bg-white/5"
                    disabled={submitting}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                      <Calendar size={12}/> Tanggal Memori
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#A855F7]/50 border border-white/10 bg-white/5 [color-scheme:dark]"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 pl-1">
                    <Captions size={12}/> Caption / Makna
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ceritakan momen dibalik gambar ini..."
                    className="w-full h-24 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#A855F7]/50 border border-white/10 bg-white/5"
                    disabled={submitting}
                    maxLength={500}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !file || !title || !caption || !eventDate}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-40"
                  style={{
                    background: (!file || !title || !caption || !eventDate) 
                      ? "rgba(255,255,255,0.1)" 
                      : "linear-gradient(135deg,#A855F7,#E879F9)",
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Mengunggah...</span>
                  ) : "✈️ Unggah Foto Ke Galeri"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Gallery Masonry / Grid ── */}
      <div className="pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={32} className="animate-spin mb-3 text-[#A855F7]" />
            <p className="text-sm">Sedang mendekripsi memori MTO...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground rounded-3xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
            <ImageIcon size={48} className="opacity-20" />
            <div className="text-center">
              <p className="text-base font-semibold">Galeri masih kosong</p>
              <p className="text-xs opacity-60">Jadilah yang pertama mengabadikan kenangan MTO!</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 text-xs font-bold text-[#A855F7] px-4 py-2 rounded-xl bg-[#A855F7]/10 hover:bg-[#A855F7]/20 transition-colors"
            >
              Upload Sekarang
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
            {posts.map((post) => {
              const isOwner = post.user_id === userId;
              const isDeletingThis = deletingId === post.id;
              // Format date cleanly
              const dateObj = new Date(post.event_date);
              const formattedDate = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

              return (
                <div 
                  key={post.id} 
                  className="break-inside-avoid relative rounded-3xl overflow-hidden group shadow-lg cursor-pointer"
                  style={{ background: "#111116", border: "1px solid rgba(255,255,255,0.06)" }}
                  onClick={() => setSelectedImage(post)}
                >
                  {/* The Image */}
                  <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
                    {/* Placeholder aspect ratio trick, using actual responsive img */}
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      loading="lazy"
                    />
                    
                    {/* Gradient overlay for text legibility at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* Hover expand icon center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/50 p-3 rounded-full backdrop-blur-md">
                        <Maximize2 size={24} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Absolute positioning of content overlaying the bottom of the image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 text-white flex flex-col justify-end">
                    
                    {/* Top badges (Date & Uploader) */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2 -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 flex items-center gap-1">
                        <Calendar size={10} className="text-[#A855F7]" />
                        {formattedDate}
                      </span>
                      <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/10">
                        Oleh: <span className="text-[#A855F7] font-bold">{post.uploader_name.split(" ")[0]}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-base leading-tight mb-1 drop-shadow-md">{post.title}</h3>
                    
                    {/* Caption expands slightly on hover */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                      <div className="overflow-hidden">
                        <p className="text-xs text-white/80 leading-relaxed mb-1 line-clamp-4">
                          {post.caption}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button (Top Right) */}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                      disabled={isDeletingThis}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-red-400 hover:bg-black/80 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 duration-300 z-10"
                    >
                      {isDeletingThis ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox (Fullscreen Preview) Modal ── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close btn */}
            <button 
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>

            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row bg-[#0D0D14] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
            >
              {/* Image side */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[40vh] md:min-h-[60vh] max-h-[70vh] md:max-h-[90vh]">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title} 
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Info side */}
              <div className="w-full md:w-[350px] shrink-0 p-6 md:p-8 flex flex-col h-auto md:max-h-[90vh] overflow-y-auto">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-[#A855F7]/15 text-[#E879F9] px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border border-[#A855F7]/30">
                    Memori MTO
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded font-medium">
                    {new Date(selectedImage.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>

                <h3 className="font-extrabold text-2xl text-white mb-2 leading-tight">
                  {selectedImage.title}
                </h3>
                
                <p className="text-sm text-white/70 leading-relaxed mb-6 whitespace-pre-wrap flex-1">
                  {selectedImage.caption}
                </p>

                <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#A855F7] to-[#8B5CF6] text-white font-black">
                    {selectedImage.uploader_name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Diunggah Oleh</p>
                    <p className="font-bold text-sm text-white">{selectedImage.uploader_name}</p>
                    <p className="text-[10px] text-[#A855F7]">{selectedImage.uploader_dept}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
