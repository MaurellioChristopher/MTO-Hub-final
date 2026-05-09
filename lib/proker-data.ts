// Program Kerja MTO 25/26 — Maret s.d. Desember 2026

export type ProkerCategory =
  | "MTODAY"
  | "MOTM"
  | "APPRAISALS"
  | "Training Internal"
  | "Konten Materi"
  | "UPGRADING"
  | "ALUMNI GATHERING"
  | "Foto Kepengurusan"
  | "VISIT COMMUNITY"
  | "VISIT COMPANY"
  | "MT-Cast External"
  | "NIGHT CARNIVAL"
  | "OPDIS";

export interface ProkerItem {
  date: string; // YYYY-MM-DD
  title: string;
  category: ProkerCategory;
}

export const CATEGORY_CONFIG: Record<
  ProkerCategory,
  { color: string; bg: string; shortLabel: string }
> = {
  "MTODAY":             { color: "#4F8EF7", bg: "rgba(79,142,247,0.12)",  shortLabel: "MTODAY" },
  "MOTM":               { color: "#A855F7", bg: "rgba(168,85,247,0.12)",  shortLabel: "MOTM" },
  "APPRAISALS":         { color: "#D4AF37", bg: "rgba(212,175,55,0.12)",  shortLabel: "Appraisals" },
  "Training Internal":  { color: "#22C55E", bg: "rgba(34,197,94,0.12)",   shortLabel: "Training" },
  "Konten Materi":      { color: "#F97316", bg: "rgba(249,115,22,0.12)",  shortLabel: "Konten" },
  "UPGRADING":          { color: "#EC4899", bg: "rgba(236,72,153,0.12)",  shortLabel: "Upgrading" },
  "ALUMNI GATHERING":   { color: "#DC143C", bg: "rgba(220,20,60,0.12)",   shortLabel: "Alumni" },
  "Foto Kepengurusan":  { color: "#64748B", bg: "rgba(100,116,139,0.12)", shortLabel: "Foto" },
  "VISIT COMMUNITY":    { color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   shortLabel: "Visit" },
  "VISIT COMPANY":      { color: "#06B6D4", bg: "rgba(6,182,212,0.12)",   shortLabel: "Visit" },
  "MT-Cast External":   { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  shortLabel: "MT-Cast" },
  "NIGHT CARNIVAL":     { color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  shortLabel: "Carnival" },
  "OPDIS":              { color: "#94A3B8", bg: "rgba(148,163,184,0.12)", shortLabel: "OPDIS" },
};

export const PROKER_DATA: ProkerItem[] = [
  // ── Maret 2026 ──────────────────────────────────────────────────────────────
  { date: "2026-03-07", title: "Konten Materi 1",       category: "Konten Materi" },
  { date: "2026-03-07", title: "Alumni Gathering",       category: "ALUMNI GATHERING" },
  { date: "2026-03-08", title: "Foto Kepengurusan",      category: "Foto Kepengurusan" },
  { date: "2026-03-11", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-03-13", title: "Training Internal 1",    category: "Training Internal" },
  { date: "2026-03-14", title: "Konten Materi 2",        category: "Konten Materi" },
  { date: "2026-03-25", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-03-28", title: "MOTM",                   category: "MOTM" },
  { date: "2026-03-30", title: "Appraisals",             category: "APPRAISALS" },

  // ── April 2026 ──────────────────────────────────────────────────────────────
  { date: "2026-04-01", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-04-02", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-04-02", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-04-03", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-04-03", title: "Upgrading 1",            category: "UPGRADING" },
  { date: "2026-04-04", title: "Konten Materi 3",        category: "Konten Materi" },
  { date: "2026-04-04", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-04-04", title: "Upgrading 1",            category: "UPGRADING" },
  { date: "2026-04-05", title: "Upgrading 1",            category: "UPGRADING" },
  { date: "2026-04-11", title: "Training Internal 2",    category: "Training Internal" },
  { date: "2026-04-16", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-04-18", title: "Konten Materi 4",        category: "Konten Materi" },
  { date: "2026-04-25", title: "MT-Cast External",       category: "MT-Cast External" },
  { date: "2026-04-27", title: "MOTM",                   category: "MOTM" },
  { date: "2026-04-30", title: "MTODAY",                 category: "MTODAY" },

  // ── Mei 2026 ────────────────────────────────────────────────────────────────
  { date: "2026-05-02", title: "Konten Materi 5",        category: "Konten Materi" },
  { date: "2026-05-09", title: "Visit Community",        category: "VISIT COMMUNITY" },
  { date: "2026-05-14", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-05-16", title: "Konten Materi 6",        category: "Konten Materi" },
  { date: "2026-05-22", title: "Training Internal 3",    category: "Training Internal" },
  { date: "2026-05-25", title: "MOTM",                   category: "MOTM" },

  // ── Juni 2026 ───────────────────────────────────────────────────────────────
  { date: "2026-06-03", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-06-06", title: "Konten Materi 7",        category: "Konten Materi" },
  { date: "2026-06-17", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-06-20", title: "Konten Materi 8",        category: "Konten Materi" },
  { date: "2026-06-28", title: "MOTM",                   category: "MOTM" },

  // ── Juli 2026 ───────────────────────────────────────────────────────────────
  { date: "2026-07-04", title: "Konten Materi 9",        category: "Konten Materi" },
  { date: "2026-07-08", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-07-18", title: "Konten Materi 10",       category: "Konten Materi" },
  { date: "2026-07-22", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-07-26", title: "MOTM",                   category: "MOTM" },
  { date: "2026-07-28", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-07-29", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-07-29", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-07-30", title: "Appraisals",             category: "APPRAISALS" },

  // ── Agustus 2026 ────────────────────────────────────────────────────────────
  { date: "2026-08-01", title: "Konten Materi 11",       category: "Konten Materi" },
  { date: "2026-08-01", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-08-02", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-08-03", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-08-04", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-08-06", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-08-15", title: "Konten Materi 12",       category: "Konten Materi" },
  { date: "2026-08-20", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-08-21", title: "MT-Cast External",       category: "MT-Cast External" },
  { date: "2026-08-28", title: "MOTM",                   category: "MOTM" },

  // ── September 2026 ──────────────────────────────────────────────────────────
  { date: "2026-09-05", title: "Konten Materi 13",       category: "Konten Materi" },
  { date: "2026-09-09", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-09-19", title: "Konten Materi 14",       category: "Konten Materi" },
  { date: "2026-09-23", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-09-26", title: "Upgrading 2",            category: "UPGRADING" },
  { date: "2026-09-27", title: "Upgrading 2",            category: "UPGRADING" },
  { date: "2026-09-28", title: "MOTM",                   category: "MOTM" },

  // ── Oktober 2026 ────────────────────────────────────────────────────────────
  { date: "2026-10-03", title: "Konten Materi 15",       category: "Konten Materi" },
  { date: "2026-10-03", title: "Night Carnival",         category: "NIGHT CARNIVAL" },
  { date: "2026-10-07", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-10-15", title: "OPDIS 1",                category: "OPDIS" },
  { date: "2026-10-17", title: "Konten Materi 16",       category: "Konten Materi" },
  { date: "2026-10-21", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-10-25", title: "MOTM",                   category: "MOTM" },

  // ── November 2026 ───────────────────────────────────────────────────────────
  { date: "2026-11-07", title: "Konten Materi 17",       category: "Konten Materi" },
  { date: "2026-11-11", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-11-12", title: "OPDIS 2",                category: "OPDIS" },
  { date: "2026-11-21", title: "Konten Materi 18",       category: "Konten Materi" },
  { date: "2026-11-21", title: "Visit Company",          category: "VISIT COMPANY" },
  { date: "2026-11-25", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-11-28", title: "MOTM",                   category: "MOTM" },
  { date: "2026-11-30", title: "Appraisals",             category: "APPRAISALS" },

  // ── Desember 2026 ───────────────────────────────────────────────────────────
  { date: "2026-12-01", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-12-02", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-12-04", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-12-05", title: "Konten Materi 19",       category: "Konten Materi" },
  { date: "2026-12-05", title: "Appraisals",             category: "APPRAISALS" },
  { date: "2026-12-09", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-12-19", title: "Konten Materi 20",       category: "Konten Materi" },
  { date: "2026-12-23", title: "MTODAY",                 category: "MTODAY" },
  { date: "2026-12-27", title: "MOTM",                   category: "MOTM" },
];

// Group by month label
export const MONTH_LABELS: Record<string, string> = {
  "2026-03": "Maret 2026",
  "2026-04": "April 2026",
  "2026-05": "Mei 2026",
  "2026-06": "Juni 2026",
  "2026-07": "Juli 2026",
  "2026-08": "Agustus 2026",
  "2026-09": "September 2026",
  "2026-10": "Oktober 2026",
  "2026-11": "November 2026",
  "2026-12": "Desember 2026",
};
