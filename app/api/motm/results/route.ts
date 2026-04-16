import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/motm/results?month=4&year=2026
// Admin only — return semua rating + user info per bulan
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year  = Number(searchParams.get("year")  ?? new Date().getFullYear());

  const supabase = getServerClient();

  // Semua ratings bulan ini
  const { data: ratings, error } = await supabase
    .from("motm_ratings")
    .select("rater_id, target_id, score, feedback_text, created_at")
    .eq("month", month)
    .eq("year", year);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Semua user aktif
  const { data: users } = await supabase
    .from("users")
    .select("id, name, nim, department, role")
    .eq("is_active", true)
    .order("department")
    .order("name");

  if (!users) return NextResponse.json([]);

  const userMap = Object.fromEntries((users ?? []).map((u) => [u.id, u]));

  // Kelompokkan: per target → semua score
  const targetMap: Record<string, {
    user: typeof users[0];
    scores: number[];
    questionScores: { q1: number[]; q2: number[]; q3: number[]; q4: number[]; q5: number[] };
    raterCount: number;
  }> = {};

  for (const rating of ratings ?? []) {
    const user = userMap[rating.target_id];
    if (!user) continue;

    if (!targetMap[rating.target_id]) {
      targetMap[rating.target_id] = {
        user,
        scores: [],
        questionScores: { q1: [], q2: [], q3: [], q4: [], q5: [] },
        raterCount: 0,
      };
    }

    targetMap[rating.target_id].scores.push(rating.score);
    targetMap[rating.target_id].raterCount++;

    try {
      const qs = JSON.parse(rating.feedback_text ?? "{}");
      for (const k of ["q1","q2","q3","q4","q5"] as const) {
        if (qs[k]) targetMap[rating.target_id].questionScores[k].push(qs[k]);
      }
    } catch { /* skip */ }
  }

  const results = Object.values(targetMap).map((t) => {
    const avg = t.scores.reduce((a, b) => a + b, 0) / (t.scores.length || 1);
    const qAvg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    return {
      ...t.user,
      avgScore: Number(avg.toFixed(2)),
      raterCount: t.raterCount,
      q1Avg: Number(qAvg(t.questionScores.q1).toFixed(2)),
      q2Avg: Number(qAvg(t.questionScores.q2).toFixed(2)),
      q3Avg: Number(qAvg(t.questionScores.q3).toFixed(2)),
      q4Avg: Number(qAvg(t.questionScores.q4).toFixed(2)),
      q5Avg: Number(qAvg(t.questionScores.q5).toFixed(2)),
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  return NextResponse.json({ results, totalRatings: ratings?.length ?? 0, month, year });
}
