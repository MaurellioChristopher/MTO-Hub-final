import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cxiqjvrjdkvxrmwsatfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4aXFqdnJqZGt2eHJtd3NhdGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMzMjkwOCwiZXhwIjoyMDkxOTA4OTA4fQ.8ix2V8fBurvpTnQsnfXhmnRzsrejXiwu154jRn0fvA4'
);

async function main() {
  // Cari event Visit Community di tabel events
  const { data: found, error: findErr } = await supabase
    .from('events')
    .select('id, title, date')
    .ilike('title', '%visit community%');

  if (findErr) {
    console.error('Error mencari event:', findErr.message);
    return;
  }

  console.log('Event ditemukan:', JSON.stringify(found, null, 2));

  if (!found || found.length === 0) {
    console.log('Tidak ada event Visit Community di tabel events database!');
    return;
  }

  // Update semua yang ketemu ke 2026-05-09
  for (const ev of found) {
    const { error: updErr } = await supabase
      .from('events')
      .update({ date: '2026-05-09' })
      .eq('id', ev.id);

    if (updErr) {
      console.error(`Error update id=${ev.id}:`, updErr.message);
    } else {
      console.log(`BERHASIL: id=${ev.id} "${ev.title}" ${ev.date} -> 2026-05-09`);
    }
  }
}

main().catch(console.error);
