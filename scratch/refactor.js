const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', '(dashboard)', 'dashboard', 'motm', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const oldMapBlockStr = `            <div className="space-y-4">
              {targets.map((target, idx) => {
                const targetDeptColor = DEPT_COLORS[target.department] ?? deptColor;
                const scores  = ratingsMap[target.id] ?? EMPTY;
                const isDone  = submitted.has(target.id);
                const isSub   = submitting === target.id;
                const filled  = Object.values(scores).filter(v=>v>0).length;
                const avgVal  = avg(scores);

                return (
                  <motion.div key={target.id}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:idx*0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: isDone ? \`1px solid \${deptColor}40\` : "1px solid rgba(255,255,255,0.08)",
                      background: isDone ? \`\${deptColor}06\` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-5 py-4"
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background:deptColor }}>
                        {target.name.split(" ").slice(0,2).map(n=>n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{target.name}</p>
                        <p className="text-xs text-muted-foreground">{target.nim}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {avgVal > 0 && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:\`\${deptColor}15\`, color:deptColor, border:\`1px solid \${deptColor}30\` }}>
                            <Star size={11} style={{ fill:deptColor, color:deptColor }}/> {avgVal.toFixed(1)}
                          </span>
                        )}
                        {isDone && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:"#22C55E15", color:"#22C55E", border:"1px solid #22C55E30" }}>
                            <CheckCircle2 size={11}/> Selesai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Work Report Display (for transparency) */}
                    <div className="px-5 py-3 bg-white/[0.03] space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Laporan Kerja {target.name.split(" ")[0]}</p>
                      <div className="rounded-xl bg-black/20 p-3 italic text-xs text-white/70 leading-relaxed border border-white/5">
                        {workLogsMap[target.id] || "Belum ada laporan kerja yang diisi anggota ini."}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="px-5 py-5 space-y-5">
                      {QUESTIONS.map(q => (
                        <div key={q.key} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background:q.color }}/>
                            <div>
                              <p className="text-xs font-bold text-foreground">{q.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{q.question}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-4">
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMin}</span>
                            <StarRating value={scores[q.key]} onChange={v => setScore(target.id, q.key, v)}
                              color={q.color} disabled={isDone || isLocked}/>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMax}</span>
                          </div>
                        </div>
                      ))}

                      {/* Submit row */}
                      {!isLocked && (
                        <div className="flex items-center justify-between pt-3"
                          style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-xs">
                            {filled === 5
                              ? <span className="text-[#22C55E] font-semibold">✓ Siap disimpan</span>
                              : <span className="text-muted-foreground">{filled}/5 terisi</span>}
                          </p>
                          <button onClick={() => submitRating(target)}
                            disabled={isDone || isSub || filled < 5}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: isDone ? "#22C55E"
                                : filled === 5 ? \`linear-gradient(135deg,\${deptColor},\${deptColor}aa)\`
                                : "rgba(255,255,255,0.06)",
                              boxShadow: filled===5&&!isDone ? \`0 4px 16px \${deptColor}40\` : "none",
                            }}>
                            {isSub ? <><Loader2 size={13} className="animate-spin"/> Menyimpan...</>
                              : isDone ? <><CheckCircle2 size={13}/> Tersimpan</>
                              : <><Trophy size={13}/> Simpan</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>`;

const blockContentWithModifications = `                const targetDeptColor = DEPT_COLORS[target.department] ?? deptColor;
                const scores  = ratingsMap[target.id] ?? EMPTY;
                const isDone  = submitted.has(target.id);
                const isSub   = submitting === target.id;
                const filled  = Object.values(scores).filter(v=>v>0).length;
                const avgVal  = avg(scores);

                return (
                  <motion.div key={target.id}
                    initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:idx*0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: isDone ? \`1px solid \${deptColor}40\` : "1px solid rgba(255,255,255,0.08)",
                      background: isDone ? \`\${deptColor}06\` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-5 py-4"
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                        style={{ background:targetDeptColor }}>
                        {target.name.split(" ").slice(0,2).map(n=>n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{target.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{target.nim}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest"
                            style={{ background: \`\${targetDeptColor}15\`, color: targetDeptColor }}>
                            {target.department}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {avgVal > 0 && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:\`\${deptColor}15\`, color:deptColor, border:\`1px solid \${deptColor}30\` }}>
                            <Star size={11} style={{ fill:deptColor, color:deptColor }}/> {avgVal.toFixed(1)}
                          </span>
                        )}
                        {isDone && (
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold"
                            style={{ background:"#22C55E15", color:"#22C55E", border:"1px solid #22C55E30" }}>
                            <CheckCircle2 size={11}/> Selesai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Work Report Display (for transparency) */}
                    <div className="px-5 py-3 bg-white/[0.03] space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Laporan Kerja {target.name.split(" ")[0]}</p>
                      <div className="rounded-xl bg-black/20 p-3 italic text-xs text-white/70 leading-relaxed border border-white/5">
                        {workLogsMap[target.id] || "Belum ada laporan kerja yang diisi anggota ini."}
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="px-5 py-5 space-y-5">
                      {QUESTIONS.map(q => (
                        <div key={q.key} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background:q.color }}/>
                            <div>
                              <p className="text-xs font-bold text-foreground">{q.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{q.question}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-4">
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMin}</span>
                            <StarRating value={scores[q.key]} onChange={v => setScore(target.id, q.key, v)}
                              color={q.color} disabled={isDone || isLocked}/>
                            <span className="text-[10px] text-muted-foreground/50 shrink-0">{q.scaleMax}</span>
                          </div>
                        </div>
                      ))}

                      {/* Submit row */}
                      {!isLocked && (
                        <div className="flex items-center justify-between pt-3"
                          style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-xs">
                            {filled === 5
                              ? <span className="text-[#22C55E] font-semibold">✓ Siap disimpan</span>
                              : <span className="text-muted-foreground">{filled}/5 terisi</span>}
                          </p>
                          <button onClick={() => submitRating(target)}
                            disabled={isDone || isSub || filled < 5}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: isDone ? "#22C55E"
                                : filled === 5 ? \`linear-gradient(135deg,\${deptColor},\${deptColor}aa)\`
                                : "rgba(255,255,255,0.06)",
                              boxShadow: filled===5&&!isDone ? \`0 4px 16px \${deptColor}40\` : "none",
                            }}>
                            {isSub ? <><Loader2 size={13} className="animate-spin"/> Menyimpan...</>
                              : isDone ? <><CheckCircle2 size={13}/> Tersimpan</>
                              : <><Trophy size={13}/> Simpan</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );`;

const newSectionsStr = `            <div className="space-y-8">
              {/* Own Dept Targets */}
              {targets.filter(t => t.department === dept).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-2">
                    <Users size={16} className="text-[#D4AF37]" />
                    Anggota Departemen {dept}
                  </h3>
                  {targets.filter(t => t.department === dept).map((target, idx) => {
${blockContentWithModifications}
                  })}
                </div>
              )}

              {/* Other Dept Targets (KADEPTs) */}
              {targets.filter(t => t.department !== dept).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-2">
                    <Star size={16} className="text-[#D4AF37]" />
                    KADEPT Departemen Lain
                  </h3>
                  {targets.filter(t => t.department !== dept).map((target, idx) => {
${blockContentWithModifications}
                  })}
                </div>
              )}
            </div>`;

// Since there can be minor whitespace issues, we can just find the start and end of the block
const startMatch = \`            <div className="space-y-4">\n              {targets.map((target, idx) => {\`;
const startIdx = content.indexOf(\`            <div className="space-y-4">\\r\\n              {targets.map((target, idx) => {\`);
const startIdx2 = content.indexOf(\`            <div className="space-y-4">\\n              {targets.map((target, idx) => {\`);

let actualStartIdx = startIdx !== -1 ? startIdx : startIdx2;

if (actualStartIdx !== -1) {
  // Find the end:
  const endMatchStr = \`              })}\\r\\n            </div>\`;
  const endMatchStr2 = \`              })}\\n            </div>\`;
  
  let actualEndIdx = content.indexOf(endMatchStr, actualStartIdx);
  let len = endMatchStr.length;
  if (actualEndIdx === -1) {
    actualEndIdx = content.indexOf(endMatchStr2, actualStartIdx);
    len = endMatchStr2.length;
  }
  
  if (actualEndIdx !== -1) {
    content = content.substring(0, actualStartIdx) + newSectionsStr + content.substring(actualEndIdx + len);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Refactored successfully.");
  } else {
    console.log("Could not find end index");
  }
} else {
  console.log("Could not find start index");
}
