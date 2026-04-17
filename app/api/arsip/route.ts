import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── GET: Ambil semua berkas (+ info uploader) ─────────────────────────────────
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const supabase = getServerClient();

  let query = supabase
    .from("arsip_berkas")
    .select("*")
    .order("created_at", { ascending: false });

  if (category && category !== "Semua") {
    query = query.eq("category", category);
  }

  const { data: berkas, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with uploader name & department
  const { data: users } = await supabase
    .from("users")
    .select("id, name, department");
  const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));

  const enriched = (berkas || []).map((b) => ({
    ...b,
    uploader_name: userMap[b.uploader_id]?.name || "Admin MTO",
    uploader_dept: userMap[b.uploader_id]?.department || "INTI",
  }));

  return NextResponse.json(enriched);
}

// ── POST: Upload berkas baru (Admin only) ────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ error: "Hanya Admin yang dapat mengupload berkas." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title       = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category    = formData.get("category") as string;
    const file        = formData.get("file") as File;

    if (!file || !title || !category) {
      return NextResponse.json({ error: "Data tidak lengkap (judul, kategori, dan file wajib diisi)" }, { status: 400 });
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 20MB" }, { status: 400 });
    }

    const supabase = getServerClient();

    // 1. Upload ke Supabase Storage
    const fileExt  = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("arsip-berkas")
      .upload(storageName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Gagal upload ke storage: " + uploadError.message }, { status: 500 });
    }

    // 2. Ambil public URL
    const { data: urlData } = supabase.storage
      .from("arsip-berkas")
      .getPublicUrl(storageName);

    // 3. Simpan ke database
    const { error: dbError } = await supabase.from("arsip_berkas").insert({
      uploader_id: session.user.id,
      title:       title.trim(),
      description: description?.trim() || null,
      category,
      file_url:    urlData.publicUrl,
      file_name:   file.name,
      file_type:   file.type || `application/${fileExt}`,
      file_size:   file.size,
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Arsip POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE: Hapus berkas (Admin only) ─────────────────────────────────────────
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "Admin") {
    return NextResponse.json({ error: "Hanya Admin yang dapat menghapus berkas." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID berkas diperlukan" }, { status: 400 });

  const supabase = getServerClient();

  const { data: berkas, error: getErr } = await supabase
    .from("arsip_berkas")
    .select("file_url, file_name")
    .eq("id", id)
    .single();

  if (getErr || !berkas) return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 404 });

  // Hapus dari storage
  const storageMatch = berkas.file_url.match(/\/arsip-berkas\/(.+)$/);
  if (storageMatch?.[1]) {
    await supabase.storage.from("arsip-berkas").remove([storageMatch[1]]);
  }

  // Hapus dari database
  const { error: delErr } = await supabase.from("arsip_berkas").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
