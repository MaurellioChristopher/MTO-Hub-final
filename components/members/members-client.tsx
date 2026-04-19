"use client";

import { useState, useMemo } from "react";
import { Search, Users, Shield, X, AtSign, Link2, Code2, Globe, Calendar, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Member } from "@/types";

// ── Tipe ─────────────────────────────────────────────────────────────────────
type Department = "ALL" | "INTI" | "MI" | "MP" | "SD" | "SI";

interface MembersClientProps {
  members: Member[];
}

// ── Konfigurasi departemen ─────────────────────────────────────────────────────
const DEPT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INTI: { label: "Inti Organisasi",    color: "#DC143C", bg: "rgba(220,20,60,0.12)"  },
  MI:   { label: "Managerial Internal", color: "#D4AF37", bg: "rgba(212,175,55,0.12)" },
  MP:   { label: "Media Publication",   color: "#4F8EF7", bg: "rgba(79,142,247,0.12)" },
  SD:   { label: "Self Development",    color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  SI:   { label: "Self Improvement",    color: "#A855F7", bg: "rgba(168,85,247,0.12)" },
};

const JABATAN: Record<string, string> = {
  "102022430009": "Ketua Umum",
  "102012340370": "Wakil Ketua Umum",
  "102012330384": "Sekretaris",
  "102022430027": "Bendahara",
  "102012430030": "Kepala Departemen MI",
  "102022400160": "Kepala Departemen MP",
  "102012340269": "Kepala Departemen SD",
  "102022400208": "Kepala Departemen SI",
};

function getJabatan(m: Member) {
  return JABATAN[m.nim] ?? `Staf ${m.department}`;
}

const POSITION_PRIORITY: Record<string, number> = {
  "Ketua Umum": 1,
  "Wakil Ketua Umum": 2,
  "Sekretaris": 3,
  "Bendahara": 4,
  "Kepala Departemen MI": 5,
  "Kepala Departemen MP": 5,
  "Kepala Departemen SD": 5,
  "Kepala Departemen SI": 5,
};

// ── Avatar ───────────────────────────────────────────────────────────────────
function AvatarCircle({
  name, color, avatarUrl, size = "md",
}: { name: string; color: string; avatarUrl?: string | null; size?: "md" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("");
  const sizeClass = size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-xs";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-black text-white overflow-hidden ${sizeClass}`}
      style={{ background: color, boxShadow: `0 0 12px ${color}40` }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        : initials}
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ member, color, bg, onClose }: {
  member: Member; color: string; bg: string; onClose: () => void;
}) {
  const jabatan = getJabatan(member);
  const social = (member as any).social_links as {
    instagram?: string; linkedin?: string; github?: string; website?: string;
  } | null;
  const avatarUrl = (member as any).avatar_url as string | null;
  const bio = (member as any).bio as string | null;

  const socialLinks = [
    { key: "instagram", icon: AtSign, label: "Instagram", href: `https://instagram.com/${social?.instagram}`, value: social?.instagram ? `@${social.instagram}` : null },
    { key: "linkedin",  icon: Link2,  label: "LinkedIn",  href: social?.linkedin,    value: social?.linkedin  || null },
    { key: "github",    icon: Code2,  label: "GitHub",    href: social?.github,      value: social?.github    || null },
    { key: "website",   icon: Globe,  label: "Website",   href: social?.website,     value: social?.website   || null },
  ].filter((s) => s.value);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: "#0D0D14", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Gradient header */}
        <div
          className="relative h-20 w-full"
          style={{ background: `linear-gradient(135deg, ${color}30, transparent)` }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: `radial-gradient(circle at 20% 50%, ${color}, transparent 70%)` }}
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 hover:bg-black/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>

          {/* Avatar pinned to bottom of header */}
          <div className="absolute -bottom-8 left-5">
            <div className="rounded-2xl p-0.5" style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}>
              <AvatarCircle name={member.name} color={color} avatarUrl={avatarUrl} size="lg" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pt-10 pb-5 space-y-4">
          {/* Name & role */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-foreground">{member.name}</h2>
              {member.role === "Admin" && (
                <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                  <Shield size={9} /> Admin
                </span>
              )}
            </div>
            <span
              className="mt-1 inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: bg, color, border: `1px solid ${color}30` }}
            >
              {jabatan}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Hash,     label: "NIM",         value: member.nim },
              { icon: Shield,   label: "Departemen",  value: member.department },
              { icon: Calendar, label: "Bergabung",   value: new Date(member.created_at).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1 mb-1">
                  <item.icon size={10} className="text-muted-foreground/50" />
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/40">{item.label}</p>
                </div>
                <p className="text-xs font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {bio && (
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">Tentang</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">"{bio}"</p>
            </div>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Social Media</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}
                  >
                    <s.icon size={12} />
                    {s.value}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No social state */}
          {socialLinks.length === 0 && !bio && (
            <p className="text-center text-xs text-muted-foreground/40 py-2">
              Anggota belum mengisi profil lengkap
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MembersClient({ members }: MembersClientProps) {
  const [search, setSearch]         = useState("");
  const [activeDept, setActiveDept] = useState<Department>("ALL");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const matchDept = activeDept === "ALL" || m.department === activeDept;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.nim.includes(q) ||
          m.department.toLowerCase().includes(q);
        return matchDept && matchSearch;
      })
      .sort((a, b) => {
        const priorityA = POSITION_PRIORITY[getJabatan(a)] ?? 10;
        const priorityB = POSITION_PRIORITY[getJabatan(b)] ?? 10;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // Jika prioritas sama (sama-sama staf), urutkan berdasarkan nama
        return a.name.localeCompare(b.name);
      });
  }, [members, activeDept, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    members.forEach((m) => { c[m.department] = (c[m.department] ?? 0) + 1; });
    return c;
  }, [members]);

  const depts: Department[] = ["ALL", "INTI", "MI", "MP", "SD", "SI"];

  return (
    <div className="space-y-6">

      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {selectedMember && (() => {
          const cfg = DEPT_CONFIG[selectedMember.department];
          return (
            <ProfileModal
              key={selectedMember.id}
              member={selectedMember}
              color={cfg.color}
              bg={cfg.bg}
              onClose={() => setSelectedMember(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            MTO Staff{" "}
            <span style={{
              background: "linear-gradient(135deg, #DC143C, #FF4D6D)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>25/26</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} dari {members.length} anggota ditampilkan
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="search-members"
            type="text"
            placeholder="Cari nama atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "var(--foreground)" }}
          />
        </div>
      </div>

      {/* ── Dept Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {depts.map((d) => {
          const cfg      = d === "ALL" ? null : DEPT_CONFIG[d];
          const isActive = activeDept === d;
          return (
            <button
              key={d}
              id={`filter-dept-${d.toLowerCase()}`}
              onClick={() => setActiveDept(d)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={isActive
                ? { background: cfg?.color ?? "#DC143C", color: "#fff", boxShadow: `0 0 16px ${cfg?.color ?? "#DC143C"}50` }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--muted-foreground)" }}
            >
              {d === "ALL" ? <><Users size={14} />Semua</> : d}
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)" }}
              >
                {counts[d] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Department Sections ── */}
      <div className="space-y-6">
        {depts
          .filter((d) => d !== "ALL" && (activeDept === "ALL" || activeDept === d))
          .map((dept) => {
            const deptMembers = filtered.filter((m) => m.department === dept);
            if (!deptMembers.length) return null;
            const cfg = DEPT_CONFIG[dept];
            return (
              <section key={dept}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${cfg.color}40, transparent)` }} />
                  <span className="rounded-lg px-3 py-1 text-xs font-black tracking-wider"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {dept}
                  </span>
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                  <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${cfg.color}40, transparent)` }} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {deptMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      color={cfg.color}
                      bg={cfg.bg}
                      onClick={() => setSelectedMember(member)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
            <Users size={40} className="opacity-30" />
            <p className="text-sm">Tidak ada anggota yang cocok dengan pencarian.</p>
            <button
              onClick={() => { setSearch(""); setActiveDept("ALL"); }}
              className="text-xs underline underline-offset-2 hover:text-foreground"
            >Reset filter</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, color, bg, onClick }: {
  member: Member; color: string; bg: string; onClick: () => void;
}) {
  const isAdmin   = member.role === "Admin";
  const avatarUrl = (member as any).avatar_url as string | null;
  const hasSocial = !!((member as any).social_links && Object.values((member as any).social_links || {}).some(Boolean));

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: isAdmin ? `0 0 20px ${color}20` : undefined,
      }}
    >
      {/* Admin glow border */}
      {isAdmin && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${color}50` }}
        />
      )}

      {/* Hover top accent */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex items-center gap-3">
        <AvatarCircle name={member.name} color={color} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.nim}</p>
        </div>
        {isAdmin && <Shield size={14} color={color} className="shrink-0" />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: bg, color, border: `1px solid ${color}30` }}
        >
          {getJabatan(member)}
        </span>
        {hasSocial && (
          <span className="text-[9px] font-bold text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
            Lihat profil →
          </span>
        )}
      </div>
    </button>
  );
}
