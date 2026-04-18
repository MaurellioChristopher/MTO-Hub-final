"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, Save, CheckCircle2, AlertCircle, Loader2,
  AtSign, Link2, Code2, Globe, Mail, Shield,
  Edit2, Building2, Tag, Sparkles,
} from "lucide-react";

const DEPT_COLORS: Record<string, string> = {
  INTI: "#DC143C", MI: "#D4AF37", MP: "#4F8EF7", SD: "#22C55E", SI: "#A855F7",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

interface ProfileData {
  id: string;
  name: string;
  nim: string;
  username: string;
  email: string;
  role: string;
  department: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: {
    instagram?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  } | null;
  created_at: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const dept      = session?.user?.department ?? "INTI";
  const deptColor = DEPT_COLORS[dept] ?? "#DC143C";

  const [profile, setProfile]       = useState<ProfileData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar]   = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Bio
  const [bio, setBio]         = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Social Links
  const [social, setSocial]     = useState({ instagram: "", linkedin: "", github: "", website: "" });
  const [savingSocial, setSavingSocial] = useState(false);

  // Password
  const [passCurrent, setPassCurrent] = useState("");
  const [passNew, setPassNew]         = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [savingPass, setSavingPass]   = useState(false);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d: ProfileData) => {
        setProfile(d);
        setBio(d.bio ?? "");
        setSocial({
          instagram: d.social_links?.instagram ?? "",
          linkedin:  d.social_links?.linkedin  ?? "",
          github:    d.social_links?.github    ?? "",
          website:   d.social_links?.website   ?? "",
        });
      })
      .catch(() => showToast("Gagal memuat profil", false))
      .finally(() => setLoading(false));
  }, []);

  // ── Avatar handlers ────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { showToast("Foto maksimal 3MB", false); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setSavingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const res = await fetch("/api/user/profile", { method: "PATCH", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProfile((prev) => prev ? { ...prev, avatar_url: json.avatar_url } : prev);
      setAvatarFile(null);
      showToast("✅ Foto profil diperbarui!", true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSavingAvatar(false);
    }
  };

  // ── Bio save ───────────────────────────────────────────────────────────────
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await update({ bio });
      setProfile((prev) => prev ? { ...prev, bio } : prev);
      showToast("✅ Bio diperbarui!", true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSavingBio(false);
    }
  };

  // ── Social links save ──────────────────────────────────────────────────────
  const handleSaveSocial = async () => {
    setSavingSocial(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: social }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProfile((prev) => prev ? { ...prev, social_links: social } : prev);
      showToast("✅ Social link diperbarui!", true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSavingSocial(false);
    }
  };

  // ── Password change ────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!passCurrent || !passNew || !passConfirm) {
      showToast("Semua field password harus diisi", false);
      return;
    }
    if (passNew !== passConfirm) {
      showToast("Konfirmasi password tidak cocok", false);
      return;
    }
    if (passNew.length < 6) {
      showToast("Password baru minimal 6 karakter", false);
      return;
    }

    setSavingPass(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passCurrent, newPassword: passNew }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      setPassCurrent("");
      setPassNew("");
      setPassConfirm("");
      showToast("✅ Password berhasil diperbarui!", true);
    } catch (err: any) {
      showToast(err.message, false);
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-3 text-[#DC143C]" />
        <p className="text-sm">Memuat profil...</p>
      </div>
    );
  }

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Sparkles size={22} className="text-[#DC143C]" />
          Pengaturan{" "}
          <span style={{
            background: "linear-gradient(135deg,#DC143C,#D4AF37)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Profil</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola foto, bio, dan tautan sosial media kamu di MTO-Hub.
        </p>
      </div>

      {/* ── Identity Card (Read-only) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">Identitas Anggota</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: User,      label: "Nama Lengkap", value: profile?.name },
            { icon: Tag,       label: "NIM",          value: profile?.nim },
            { icon: Building2, label: "Departemen",   value: profile?.department },
            { icon: Shield,    label: "Role",         value: profile?.role },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon size={11} className="text-muted-foreground/50" />
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/50">{item.label}</p>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">{item.value ?? "—"}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground/30">Data identitas hanya dapat diubah oleh Admin.</p>
      </motion.div>

      {/* ── Avatar ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Camera size={15} className="text-[#DC143C]" />
          <p className="text-sm font-bold text-foreground">Foto Profil</p>
        </div>

        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div
            className="relative h-24 w-24 shrink-0 rounded-full cursor-pointer group"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-full w-full rounded-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-full text-2xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${deptColor}, ${deptColor}99)` }}
              >
                {profile?.name ? getInitials(profile.name) : "?"}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            {/* Ring */}
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${deptColor}` }} />
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Klik foto untuk pilih gambar baru. Rekomendasi: foto persegi, min 200×200px, maks <strong className="text-foreground">3MB</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => avatarRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              >
                <Camera size={13} /> Pilih Foto
              </button>
              {avatarFile && (
                <button
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 14px rgba(220,20,60,0.3)" }}
                >
                  {savingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {savingAvatar ? "Menyimpan..." : "Simpan Foto"}
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </motion.div>

      {/* ── Bio ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 space-y-3"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 size={15} className="text-[#DC143C]" />
            <p className="text-sm font-bold text-foreground">Bio</p>
          </div>
          <p className="text-[10px] text-muted-foreground/40">{bio.length}/300</p>
        </div>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ceritakan sedikit tentang dirimu, hobi, atau peranmu di MTO..."
          maxLength={300}
          rows={4}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm text-white outline-none transition-all border border-white/10 bg-white/5 focus:border-[#DC143C]/40 focus:ring-1 focus:ring-[#DC143C]/30 placeholder:text-muted-foreground/40"
        />

        <button
          onClick={handleSaveBio}
          disabled={savingBio}
          id="btn-save-bio"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 14px rgba(220,20,60,0.25)" }}
        >
          {savingBio ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {savingBio ? "Menyimpan..." : "Simpan Bio"}
        </button>
      </motion.div>

      {/* ── Social Links ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-[#DC143C]" />
          <p className="text-sm font-bold text-foreground">Social Media & Link</p>
        </div>

        <div className="space-y-3">
          {[
            { key: "instagram", icon: AtSign, label: "Instagram",  placeholder: "username (tanpa @)",           color: "#E1306C" },
            { key: "linkedin",  icon: Link2,  label: "LinkedIn",   placeholder: "linkedin.com/in/username",      color: "#0A66C2" },
            { key: "github",    icon: Code2,  label: "GitHub",     placeholder: "github.com/username",           color: "#FFFFFF" },
            { key: "website",   icon: Globe,  label: "Website",    placeholder: "https://yourwebsite.com",       color: "#4F8EF7" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}
              >
                <item.icon size={15} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground/50 mb-1 uppercase tracking-wide">{item.label}</p>
                <input
                  type="text"
                  value={social[item.key as keyof typeof social]}
                  onChange={(e) => setSocial((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  placeholder={item.placeholder}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none border border-white/10 bg-white/5 focus:border-[#DC143C]/40 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSocial}
          disabled={savingSocial}
          id="btn-save-social"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 14px rgba(220,20,60,0.25)" }}
        >
          {savingSocial ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {savingSocial ? "Menyimpan..." : "Simpan Social Links"}
        </button>
      </motion.div>

      {/* ── Security ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-[#DC143C]" />
          <p className="text-sm font-bold text-foreground">Keamanan Akun</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/50 mb-1 uppercase tracking-wide">Password Saat Ini</p>
            <input
              type="password" value={passCurrent} onChange={(e) => setPassCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-2 text-sm text-white outline-none border border-white/10 bg-white/5 focus:border-[#DC143C]/40 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/50 mb-1 uppercase tracking-wide">Password Baru</p>
              <input
                type="password" value={passNew} onChange={(e) => setPassNew(e.target.value)}
                placeholder="min. 6 karakter"
                className="w-full rounded-xl px-4 py-2 text-sm text-white outline-none border border-white/10 bg-white/5 focus:border-[#DC143C]/40 transition-all"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/50 mb-1 uppercase tracking-wide">Konfirmasi Password Baru</p>
              <input
                type="password" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)}
                placeholder="ulangi password baru"
                className="w-full rounded-xl px-4 py-2 text-sm text-white outline-none border border-white/10 bg-white/5 focus:border-[#DC143C]/40 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePassword}
          disabled={savingPass}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#DC143C,#8B0000)", boxShadow: "0 4px 14px rgba(220,20,60,0.25)" }}
        >
          {savingPass ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
          {savingPass ? "Memperbarui..." : "Update Password"}
        </button>
      </motion.div>

      {/* ── Email info ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Mail size={14} className="text-muted-foreground/50" />
          <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">Email Terdaftar</p>
        </div>
        <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
        <p className="text-[10px] text-muted-foreground/30 mt-1">Jaga kerahasiaan password kamu untuk keamanan akun.</p>
      </motion.div>

    </div>
  );
}
