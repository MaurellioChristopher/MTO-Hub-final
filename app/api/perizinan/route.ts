import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerClient } from "@/lib/db";

// ── GET: ambil list perizinan ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServerClient();
  const isAdmin = session.user.role === "Admin";

  let query = supabase
    .from("perizinan")
    .select("*")
    .order("created_at", { ascending: false });

  // non-admin hanya lihat milik sendiri
  if (!isAdmin) {
    query = query.eq("user_id", session.user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (data ?? []).map((row: any) => ({
    id: row.id,
    nama: row.nama,
    nim: row.nim,
    jurusan: row.jurusan,
    divisi: row.divisi,
    keterangan: row.keterangan,
    status: row.status,
    buktiUrl: row.bukti_url,
    buktiNama: row.bukti_nama,
    createdAt: row.created_at,
  }));

  return NextResponse.json(mapped);
}

// ── POST: submit perizinan baru ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServerClient();

  const fd = await req.formData();
  const nama = fd.get("nama") as string;
  const nim = fd.get("nim") as string;
  const jurusan = fd.get("jurusan") as string;
  const divisi = fd.get("divisi") as string;
  const keterangan = fd.get("keterangan") as string;
  const buktiFile = fd.get("bukti") as File | null;

  if (!nama || !nim || !jurusan || !divisi || !keterangan) {
    return NextResponse.json({ error: "Field tidak lengkap" }, { status: 400 });
  }

  let buktiUrl: string | null = null;
  let buktiNama: string | null = null;

  // Upload bukti ke Supabase Storage jika ada
  if (buktiFile && buktiFile.size > 0) {
    if (buktiFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const ext = buktiFile.name.split(".").pop();
    const fileName = `perizinan/${session.user.id}/${Date.now()}.${ext}`;
    const bytes = await buktiFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, bytes, {
        contentType: buktiFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    buktiUrl = urlData.publicUrl;
    buktiNama = buktiFile.name;
  }

  const { data, error } = await supabase
    .from("perizinan")
    .insert({
      user_id: session.user.id,
      nama,
      nim,
      jurusan,
      divisi,
      keterangan,
      status: "pending",
      bukti_url: buktiUrl,
      bukti_nama: buktiNama,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// ── PATCH: update status (Admin only) ─────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getServerClient();

  const { id, status } = await req.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perizinan")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── DELETE: hapus perizinan (Admin only) ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getServerClient();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  }

  const { error } = await supabase.from("perizinan").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
