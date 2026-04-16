"use client";

import { useState, useMemo } from "react";
import { Search, Users, Shield } from "lucide-react";
import type { Member } from "@/types";

// ── Tipe ─────────────────────────────────────────────────────────────────────
type Department = "ALL" | "INTI" | "MI" | "MP" | "SD" | "SI";

interface MembersClientProps {
  members: Member[];
}

// ── Konfigurasi departemen ────────────────────────────────────────────────────
const DEPT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INTI: { label: "Inti Organisasi",    color: "#DC143C", bg: "rgba(220,20,60,0.12)"  },
  MI:   { label: "Managerial Internal", color: "#D4AF37", bg: "rgba(212,175,55,0.12)" },
  MP:   { label: "Media Publication",   color: "#4F8EF7", bg: "rgba(79,142,247,0.12)" },
  SD:   { label: "Self Development",    color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  SI:   { label: "Self Improvement",    color: "#A855F7", bg: "rgba(168,85,247,0.12)" },
};

// Avatar inisial
function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
      style={{ background: color, boxShadow: `0 0 12px ${color}40` }}
    >
      {initials}
    </div>
  );
}

export function MembersClient({ members }: MembersClientProps) {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState<Department>("ALL");

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchDept = activeDept === "ALL" || m.department === activeDept;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.nim.includes(q) ||
        m.department.toLowerCase().includes(q);
      return matchDept && matchSearch;
    });
  }, [members, activeDept, search]);

  // Count per dept
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    members.forEach((m) => {
      c[m.department] = (c[m.department] ?? 0) + 1;
    });
    return c;
  }, [members]);

  const depts: Department[] = ["ALL", "INTI", "MI", "MP", "SD", "SI"];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            MTO Staff{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #DC143C, #FF4D6D)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              25/26
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} dari {members.length} anggota ditampilkan
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="search-members"
            type="text"
            placeholder="Cari nama atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      {/* ── Dept Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {depts.map((d) => {
          const cfg = d === "ALL" ? null : DEPT_CONFIG[d];
          const isActive = activeDept === d;
          return (
            <button
              key={d}
              id={`filter-dept-${d.toLowerCase()}`}
              onClick={() => setActiveDept(d)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: cfg?.color ?? "#DC143C",
                      color: "#fff",
                      boxShadow: `0 0 16px ${cfg?.color ?? "#DC143C"}50`,
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--muted-foreground)",
                    }
              }
            >
              {d === "ALL" ? (
                <>
                  <Users size={14} />
                  Semua
                </>
              ) : (
                d
              )}
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)",
                }}
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
                {/* Section header */}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-px flex-1"
                    style={{ background: `linear-gradient(90deg, ${cfg.color}40, transparent)` }}
                  />
                  <span
                    className="rounded-lg px-3 py-1 text-xs font-black tracking-wider"
                    style={{
                      background: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}30`,
                    }}
                  >
                    {dept}
                  </span>
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                  <div
                    className="h-px flex-1"
                    style={{ background: `linear-gradient(270deg, ${cfg.color}40, transparent)` }}
                  />
                </div>

                {/* Member cards — responsive grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {deptMembers.map((member) => (
                    <MemberCard key={member.id} member={member} color={cfg.color} bg={cfg.bg} />
                  ))}
                </div>
              </section>
            );
          })}

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
            <Users size={40} className="opacity-30" />
            <p className="text-sm">Tidak ada anggota yang cocok dengan pencarian.</p>
            <button
              onClick={() => { setSearch(""); setActiveDept("ALL"); }}
              className="text-xs underline underline-offset-2 hover:text-foreground"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({
  member,
  color,
  bg,
}: {
  member: Member;
  color: string;
  bg: string;
}) {
  const isAdmin = member.role === "Admin";

  // Tentukan jabatan berdasarkan NIM dan dept
  function getJabatan(m: Member) {
    const JABATAN: Record<string, string> = {
      "102022430009": "Ketua Umum",
      "102012340370": "Wakil Ketua Umum",
      "102012330384": "Sekretaris",
      "102022430027": "Bendahara",
      "102022430030": "Kepala Departemen MI",
      "102022400160": "Kepala Departemen MP",
      "102012340269": "Kepala Departemen SD",
      "102022400208": "Kepala Departemen SI",
    };
    return JABATAN[m.nim] ?? `Staf ${m.department}`;
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1"
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

      <div className="flex items-center gap-3">
        <Avatar name={member.name} color={color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.nim}</p>
        </div>
        {isAdmin && (
          <Shield size={14} color={color} className="shrink-0" title="Admin" />
        )}
      </div>

      <div className="mt-3">
        <span
          className="inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: bg, color, border: `1px solid ${color}30` }}
        >
          {getJabatan(member)}
        </span>
      </div>
    </div>
  );
}
