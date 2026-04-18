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

  // 1. Ambil data dasar (Ratings, Work Logs, Tasks, Events)
  const { data: ratings } = await supabase
    .from("motm_ratings")
    .select("rater_id, target_id, score, feedback_text")
    .eq("month", month)
    .eq("year", year);

  const { data: workLogs } = await supabase
    .from("motm_work_logs")
    .select("user_id, content")
    .eq("month", month)
    .eq("year", year);

  const { data: users } = await supabase
    .from("users")
    .select("id, name, nim, department, role")
    .eq("is_active", true)
    .order("department")
    .order("name");

  // Format tanggal untuk filter Postgres (YYYY-MM-DD)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  // Ambil even pada bulan tersebut
  const { data: events } = await supabase
    .from("events")
    .select("id")
    .gte("date", startDate)
    .lt("date", endDate);

  const eventIds = events?.map(e => e.id) || [];

  // Ambil attendance untuk event-event tersebut
  const { data: attendance } = eventIds.length > 0
    ? await supabase
        .from("attendance")
        .select("user_id, status")
        .in("event_id", eventIds)
    : { data: [] };

  // Ambil tasks yang dibuat/ada pada bulan tersebut
  const { data: tasks } = await supabase
    .from("personal_tasks")
    .select("user_id, is_completed")
    .gte("created_at", startDate)
    .lt("created_at", endDate);

  if (!users) return NextResponse.json([]);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const workLogSet = new Set(workLogs?.map(l => l.user_id) || []);

  // Kelompokkan data per user
  const targetMap: Record<string, any> = {};

  users.forEach(user => {
    targetMap[user.id] = {
      user,
      ratings: [],
      attendanceCount: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
      hasWorkLog: workLogSet.has(user.id)
    };
  });

  // Masukkan ratings
  ratings?.forEach(r => {
    if (targetMap[r.target_id]) targetMap[r.target_id].ratings.push(r.score);
  });

  // Masukkan attendance
  attendance?.forEach(a => {
    if (targetMap[a.user_id] && a.status === 'present') {
      targetMap[a.user_id].attendanceCount++;
    }
  });

  // Masukkan tasks
  tasks?.forEach(t => {
    if (targetMap[t.user_id]) {
      targetMap[t.user_id].tasksTotal++;
      if (t.is_completed) targetMap[t.user_id].tasksCompleted++;
    }
  });

  const results = Object.values(targetMap).map((t) => {
    // 1. Peer Rating Score (40%) - Skala 1-10 -> 0-100
    const avgRating = t.ratings.length > 0 
      ? (t.ratings.reduce((a: number, b: number) => a + b, 0) / t.ratings.length) * 10
      : 0;
    
    // 2. Attendance Score (30%)
    const attendanceRate = eventIds.length > 0 
      ? (t.attendanceCount / eventIds.length) * 100 
      : 100; // Jika tidak ada event, dianggap sempurna atau netral

    // 3. Work Performance Score (30%)
    // Log Kerja (15%) + Task Completion (15%)
    const logScore = t.hasWorkLog ? 100 : 0;
    const taskScore = t.tasksTotal > 0 
      ? (t.tasksCompleted / t.tasksTotal) * 100 
      : 100; // Jika tidak ada task, dianggap sempurna atau netral
    
    const performanceScore = (logScore * 0.5) + (taskScore * 0.5);

    // Final Weighted Score (50% Peer Rating + 50% Performance)
    const finalScore = (avgRating * 0.5) + (performanceScore * 0.5);

    return {
      ...t.user,
      peerRating: Number(avgRating.toFixed(2)),
      performanceScore: Number(performanceScore.toFixed(2)),
      finalScore: Number(finalScore.toFixed(2)),
      raterCount: t.ratings.length,
      hasWorkLog: t.hasWorkLog,
      tasksStats: `${t.tasksCompleted}/${t.tasksTotal}`
    };
  }).sort((a, b) => b.finalScore - a.finalScore);

  return NextResponse.json({ 
    results, 
    totalRatings: ratings?.length ?? 0, 
    totalEvents: eventIds.length,
    month, 
    year 
  });
}

// DELETE /api/motm/results
// Admin only — hapus semua rating untuk target_id tertentu di bulan & tahun spesifik
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const month    = Number(searchParams.get("month"));
  const year     = Number(searchParams.get("year"));

  if (!targetId || !month || !year) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const supabase = getServerClient();

  // 1. Prioritas: Hapus data rating (Tabel ini pasti ada)
  const { error: err1 } = await supabase
    .from("motm_ratings")
    .delete()
    .eq("target_id", targetId)
    .eq("month", month)
    .eq("year", year);

  if (err1) {
    console.error("Delete Rating Error:", err1);
    return NextResponse.json({ 
      error: "Gagal menghapus hasil rating", 
      detail: err1.message 
    }, { status: 500 });
  }

  // 2. Opsional: Hapus laporan kerja (Tabel ini mungkin belum ada)
  // Kita abaikan jika error karena tabel tidak ditemukan (PGRST204/205)
  const { error: err2 } = await supabase
    .from("motm_work_logs")
    .delete()
    .eq("user_id", targetId)
    .eq("month", month)
    .eq("year", year);

  if (err2 && !err2.message.includes("not find")) {
    console.error("Delete WorkLog Error:", err2);
  }

  return NextResponse.json({ message: "Hasil rating berhasil di-reset" });
}
