import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";

// GET /api/aspirasi — ambil semua aspirasi (publik, anonim)
export async function GET() {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from("aspirasi")
    .select("id, kategori, isi, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json([]);

  const { data: replies } = await supabase
    .from("aspirasi_replies")
    .select("id, aspirasi_id, reply_text, created_at")
    .order("created_at", { ascending: true });

  const enriched = data.map((a) => {
    const aspReplies = (replies || []).filter((r) => r.aspirasi_id === a.id);
    return {
      ...a,
      replies: aspReplies,
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/aspirasi — kirim aspirasi anonim
export async function POST(req: Request) {
  const body = await req.json();
  const { kategori, isi } = body;

  if (!isi || isi.trim().length < 10) {
    return NextResponse.json({ error: "Aspirasi terlalu pendek (min. 10 karakter)" }, { status: 400 });
  }

  const supabase = getServerClient();

  const { error } = await supabase.from("aspirasi").insert({
    kategori: kategori ?? "Umum",
    isi: isi.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
