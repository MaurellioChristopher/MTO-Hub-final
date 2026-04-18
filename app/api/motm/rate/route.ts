import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/motm/rate
// Body: { targetId, month, year, scores: { q1, q2, q3, q4, q5 }, raterId }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { targetId, month, year, scores } = body;

  if (!targetId || !month || !year || !scores) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Validasi: Hanya bisa menilai untuk bulan/tahun berjalan
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  if (Number(month) !== curMonth || Number(year) !== curYear) {
    return NextResponse.json(
      { error: "Penilaian hanya diperbolehkan untuk bulan yang sedang berjalan." },
      { status: 403 }
    );
  }

  // Hitung average score dari 5 pertanyaan
  const avgScore = Math.round(
    (scores.q1 + scores.q2 + scores.q3 + scores.q4 + scores.q5) / 5
  );

  // Feedback text dari scores
  const feedbackText = JSON.stringify(scores);

  const supabase = getServerClient();

  const { error } = await supabase.from("motm_ratings").upsert(
    {
      rater_id: session.user.id,
      target_id: targetId,
      score: avgScore,
      month,
      year,
      feedback_text: feedbackText,
    },
    { onConflict: "rater_id,target_id,month,year" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, avgScore });
}

// GET /api/motm/rate?month=4&year=2026&raterId=xxx
// Cek rating yang sudah pernah diberikan oleh rater di bulan tertentu
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year  = searchParams.get("year");

  const supabase = getServerClient();

  const { data, error } = await supabase
    .from("motm_ratings")
    .select("id, target_id, score, feedback_text, created_at")
    .eq("rater_id", session.user.id)
    .eq("month", Number(month))
    .eq("year", Number(year));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
