import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/attendance/[eventId] — semua member + status absensi untuk 1 event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const supabase = getServerClient();

  // Ambil semua user aktif
  const { data: users } = await supabase
    .from("users")
    .select("id, name, nim, department, role")
    .eq("is_active", true)
    .order("department")
    .order("name");

  // Ambil attendance untuk event ini
  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, user_id, status, photo_url, timestamp")
    .eq("event_id", eventId);

  // Map attendance ke user
  const attMap = new Map(attendance?.map((a) => [a.user_id, a]) ?? []);

  const result = (users ?? []).map((user) => ({
    ...user,
    attendance: attMap.get(user.id) ?? null,
  }));

  return NextResponse.json(result);
}

// POST /api/attendance/[eventId] — submit attendance (user sendiri atau admin untuk semua)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const body = await req.json() as { userId?: string; status: string };
  const supabase = getServerClient();

  const isAdmin  = session.user.role === "Admin";
  const targetId = isAdmin && body.userId ? body.userId : session.user.id;

  // Non-admin hanya bisa update diri sendiri
  if (!isAdmin && body.userId && body.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validStatuses = ["present", "absent", "excused"];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Upsert: insert atau update jika sudah ada
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        event_id:  eventId,
        user_id:   targetId,
        status:    body.status,
        timestamp: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Attendance upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
