import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getServerClient } from "@/lib/db";
import { auth } from "@/lib/auth";

// ── Ambil konteks MTO dari database ──────────────────────────────────────────
async function getMTOContext(): Promise<string> {
  try {
    const supabase = getServerClient();

    const todayStr = new Date().toISOString().split("T")[0];
    const { data: events } = await supabase
      .from("events")
      .select("title, date, description, location")
      .gte("date", todayStr)
      .order("date", { ascending: true })
      .limit(100);

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

    if (events?.length) {
      ctx += `=== PROKER / AGENDA MTO ===\n`;
      events.forEach((e) => {
        const tgl = e.date
          ? new Date(e.date).toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })
          : "TBD";
        ctx += `- ${e.title} — ${tgl}${e.location ? ` (${e.location})` : ""}${e.description ? `: ${e.description.slice(0, 80)}` : ""}\n`;
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key belum dikonfigurasi" }, { status: 500 });
  }

  try {
    const { message, history } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });
    }

    const context  = await getMTOContext();
    const userName = session.user.name?.split(" ")[0] ?? "Bro";

    const systemPrompt = `Kamu adalah MTOBot 🤖 — asisten AI resmi Managerial Trainer Organization (MTO) Institut Teknologi Kalimantan angkatan 25/26.

Kepribadianmu:
- Santai, friendly, dan sedikit gokil tapi tetap sopan dan informatif
- Pakai bahasa Indonesia kasual (boleh campur bahasa gaul: "wkwk", "dong", "nih", "guys")
- Sering pakai emoji biar lebih hidup
- Panggil user dengan nama: ${userName}
- Jawaban maksimal 3 paragraf singkat

ATURAN KETAT — WAJIB DIIKUTI:
1. JANGAN PERNAH mengarang, mengada-ada, atau berasumsi data yang tidak ada di konteks di bawah
2. Kalau ditanya soal proker/jadwal/anggota dan TIDAK ADA di konteks, jawab jujur: "Belum ada data di sistem nih, coba cek langsung ke admin ya 😊"
3. DILARANG keras menyebut tanggal, nama proker, nama anggota, atau informasi spesifik apapun yang tidak tercantum di bagian CONTEXT di bawah ini
4. Kalau context kosong atau tidak relevan, katakan "datanya belum diinput ke sistem"
5. Boleh jawab pertanyaan umum (matematika, pengetahuan umum, dll) secara bebas
6. Jangan pernah berbicara negatif tentang anggota MTO

${context}

INGAT: Hanya gunakan data dari CONTEXT di atas. Jangan karang apapun di luar itu!`;

    const groq = new Groq({ apiKey });

    // Build messages dengan history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Tambah history percakapan sebelumnya
    if (history?.length) {
      for (const h of history.slice(-10)) { // max 10 pesan terakhir
        messages.push({
          role: h.role === "bot" ? "assistant" : "user",
          content: h.text,
        });
      }
    }

    // Tambah pesan saat ini
    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 512,
      temperature: 0.8,
    });

    const reply = completion.choices[0]?.message?.content ?? "Hmm, aku bingung nih 😅";
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error("[MTOBot] Groq error:", err?.message ?? err);
    return NextResponse.json(
      { error: `Error: ${err?.message ?? "Unknown error"}` },
      { status: 500 }
    );
  }
}
