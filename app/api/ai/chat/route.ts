import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── Ambil konteks MTO dari database ──────────────────────────────────────────
async function getMTOContext(): Promise<string> {
  try {
    const supabase = getServerClient();

    const { data: proker } = await supabase
      .from("proker")
      .select("nama, tanggal, status, departemen")
      .order("tanggal", { ascending: true })
      .limit(20);

    const { data: pengumuman } = await supabase
      .from("pengumuman")
      .select("judul, isi, kategori, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: anggota } = await supabase
      .from("users")
      .select("name, nim, role, department")
      .eq("is_active", true)
      .order("department");

    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    let ctx = `=== CONTEXT MTO-HUB ===\nHari ini: ${today}\n\n`;

    if (anggota?.length) {
      ctx += `=== DAFTAR ANGGOTA MTO 25/26 (${anggota.length} orang) ===\n`;
      const jabatan: Record<string, string> = {
        "102022430009": "Ketua Umum",
        "102012340370": "Wakil Ketua Umum",
        "102012330384": "Sekretaris",
        "102022430027": "Bendahara",
        "102012430030": "Kepala Dept MI",
        "102022400160": "Kepala Dept MP",
        "102012340269": "Kepala Dept SD",
        "102022400208": "Kepala Dept SI",
      };
      anggota.forEach((m) => {
        const jab = jabatan[m.nim] ?? `Staf ${m.department}`;
        ctx += `- ${m.name} (${m.department}) — ${jab}\n`;
      });
      ctx += "\n";
    }

    if (proker?.length) {
      ctx += `=== PROKER / AGENDA MTO ===\n`;
      proker.forEach((p) => {
        const tgl = p.tanggal
          ? new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : "TBD";
        ctx += `- [${p.departemen}] ${p.nama} — ${tgl} (${p.status})\n`;
      });
      ctx += "\n";
    }

    if (pengumuman?.length) {
      ctx += `=== PENGUMUMAN TERBARU ===\n`;
      pengumuman.forEach((p) => {
        ctx += `- [${p.kategori}] ${p.judul}: ${p.isi?.slice(0, 100)}...\n`;
      });
    }

    return ctx;
  } catch {
    return "Konteks MTO tidak tersedia saat ini.";
  }
}

// ── POST Handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key belum dikonfigurasi di server" }, { status: 500 });
  }

  try {
    const { message, history } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    const context  = await getMTOContext();
    const userName = session.user.name?.split(" ")[0] ?? "Bro";

    const systemInstruction = `Kamu adalah MTOBot 🤖 — asisten AI resmi Managerial Trainer Organization (MTO) Institut Teknologi Kalimantan angkatan 25/26.

Kepribadianmu:
- Santai, friendly, dan sedikit gokil tapi tetap sopan dan informatif
- Pakai bahasa Indonesia kasual (boleh campur sedikit bahasa gaul: "wkwk", "dong", "nih", "guys")
- Kalau ditanya hal serius (jadwal, absensi, proker), jawab dengan akurat dan jelas
- Kalau ditanya hal random/lucu atau pertanyaan matematika, tetap jawab dengan fun
- Sering pakai emoji biar lebih hidup
- Panggil user dengan nama: ${userName}
- Jawaban maksimal 3 paragraf, jangan kepanjangan

${context}`;

    const ai = new GoogleGenAI({ apiKey });

    // Build conversation contents
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add history
    if (history?.length) {
      for (const h of history) {
        contents.push({
          role: h.role === "bot" ? "model" : "user",
          parts: [{ text: h.text }],
        });
      }
    }

    // Add current message
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      config: { systemInstruction },
      contents,
    });

    const reply = response.text ?? "Hmm, aku bingung nih 😅";
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("[MTOBot] Gemini error:", err?.message ?? err);
    return NextResponse.json(
      { error: `Error: ${err?.message ?? "Unknown error"}` },
      { status: 500 }
    );
  }
}
