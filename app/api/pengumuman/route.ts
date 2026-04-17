import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── GET: Ambil pengumuman (limit opsional) ────────────────────────────────────
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 50;

  const supabase = getServerClient();

  const { data, error } = await supabase
    .from("pengumuman")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with author name
  const { data: users } = await supabase.from("users").select("id, name, department");
  const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

  const enriched = (data || []).map((p) => ({
    ...p,
    author_name: userMap[p.author_id]?.name || "Admin MTO",
    author_dept: userMap[p.author_id]?.department || "INTI",
  }));

  return NextResponse.json(enriched);
}

// ── POST: Buat pengumuman baru (Admin only) ───────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ error: "Hanya Admin." }, { status: 403 });

  const { title, content, category, is_pinned } = await req.json();
  if (!title?.trim() || !content?.trim() || !category) {
    return NextResponse.json({ error: "Judul, isi, dan kategori wajib diisi." }, { status: 400 });
  }

  const supabase = getServerClient();
  const { error } = await supabase.from("pengumuman").insert({
    author_id: session.user.id,
    title: title.trim(),
    content: content.trim(),
    category,
    is_pinned: is_pinned ?? false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── PATCH: Toggle pin (Admin only) ───────────────────────────────────────────
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ error: "Hanya Admin." }, { status: 403 });

  const { id, is_pinned } = await req.json();
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const supabase = getServerClient();
  const { error } = await supabase.from("pengumuman").update({ is_pinned }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE: Hapus pengumuman (Admin only) ─────────────────────────────────────
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "Admin") return NextResponse.json({ error: "Hanya Admin." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  const supabase = getServerClient();
  const { error } = await supabase.from("pengumuman").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
