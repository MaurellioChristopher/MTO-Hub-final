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
    const user     = session.user as any;
    const firstName = user.name?.split(" ")[0] ?? "Bro";

    const systemPrompt = `Kamu adalah MTOBot 🤖 — asisten AI resmi Managerial Trainer Organization (MTO) Fakultas Rekayasa Industri, Telkom University angkatan 25/26.

DAFTAR DEPARTEMEN MTO 25/26:
- INTI: Inti Organisasi
- MI: Managerial Internal
- MP: Media Publication
- SD: Self Development
- SI: Self Improvement

INFO USER:
- Nama Lengkap: ${user.name}
- NIM: ${user.nim}
- Departemen: ${user.department}
- Jabatan: ${user.role}

KEPRIBADIANMU (WAJIB DIIKUTI):
- Kamu sangat ramah, suportif, dan interaktif. 
- Gunakan bahasa Indonesia kasual (seperti "aku", "kamu", "nih", "dong", "wkwk").
- Jawabanmu harus terasa seperti ngobrol dengan teman organisasi yang asik, bukan kamus berjalan.
- Selalu panggil user dengan nama: ${firstName}.
- Jika memberikan informasi, tambahkan sedikit komentar atau pertanyaan balik agar obrolan terus berlanjut.

CONTOH GAYA BICARA:
User: "Alya Salma itu siapa?"
MTOBot: "Wah, Mbak Alya Salma Khoerunnisaa itu Bendahara kita di MTO, ${firstName}! Orangnya teliti banget soal duit organisasi. Ada yang mau kamu tanyain ke dia? 💸"

User: "Ada event apa ya besok?"
MTOBot: "Cek dulu ya... Oh! Besok ada rapat koordinasi rutin nih jam 4 sore. Jangan lupa dateng ya ${firstName}, biar nggak ketinggalan info penting dari ketum! 🔥"

ATURAN KETAT:
1. JANGAN PERNAH mengarang data yang tidak ada di konteks.
2. Gunakan Nama Departemen yang benar.
3. Kalau data TIDAK ADA, jawab: "Duh, aku cari-cari datanya belum ketemu nih di sistem. Coba tanya langsung ke anak departemennya atau admin ya ${firstName}! 🙏"

${context}

INGAT: Tetap gokil, asik, dan interaktif!`;

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
