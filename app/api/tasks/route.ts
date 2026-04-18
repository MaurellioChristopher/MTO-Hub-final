import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── GET: Ambil daftar tugas user saat ini ─────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("personal_tasks")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST: Tambah tugas baru ───────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, priority, due_date } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("personal_tasks")
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        priority: priority || "medium",
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PATCH: Update status, judul, atau prioritas tugas ──────────────────────────
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, is_completed, title, priority, due_date } = body;

    if (!id) return NextResponse.json({ error: "ID tugas diperlukan" }, { status: 400 });

    const updates: any = {};
    if (is_completed !== undefined) updates.is_completed = is_completed;
    if (title !== undefined)        updates.title        = title.trim();
    if (priority !== undefined)     updates.priority     = priority;
    if (due_date !== undefined)      updates.due_date     = due_date || null;

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from("personal_tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id) // Pastikan milik user ybs
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE: Hapus tugas ───────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID tugas diperlukan" }, { status: 400 });

  const supabase = getServerClient();
  const { error } = await supabase
    .from("personal_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
