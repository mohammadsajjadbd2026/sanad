"use client";
import { useState } from "react";
type Ref = { kind: "quran" | "hadith"; ref: string; language: string };
type Item = Ref & { text: string; topic: string };
type Card = Ref & { text: string; reference: string; url: string; disclaimer: string; glossary: { id: string; term: string; preferred: string[]; avoid: string[]; note: string }[] };
type Audience = { id: string; name_ar: string; language: string };
async function post(url: string, input: unknown) { const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "تعذر الاتصال."); return body; }
function readSaved(): Ref[] { try { const rows: unknown = JSON.parse(localStorage.getItem("sanad-cards-v1") ?? "[]"); return Array.isArray(rows) ? rows.filter((x): x is Ref => x && ["quran", "hadith"].includes(x.kind) && typeof x.ref === "string" && ["ar", "en", "bn", "ur"].includes(x.language)).slice(0, 30) : []; } catch { return []; } }
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) { const result: string[] = []; for (const paragraph of text.split("\n")) { let line = ""; for (const word of paragraph.split(/\s+/u)) { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > maxWidth && line) { result.push(line); line = word; } else line = next; } if (line) result.push(line); } return result; }
export function CardStudio({ publish = false, audiences = [] }: { publish?: boolean; audiences?: Audience[] }) {
  const [query, setQuery] = useState(""), [items, setItems] = useState<Item[]>([]), [lang, setLang] = useState("ar"), [card, setCard] = useState<Card | null>(null), [saved, setSaved] = useState<Ref[]>([]), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [format, setFormat] = useState("square"), [theme, setTheme] = useState("green");
  const [audienceId, setAudienceId] = useState(audiences[0]?.id ?? ""), [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  async function run(action: () => Promise<void>) { setBusy(true); setMessage(""); try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذرت العملية."); } finally { setBusy(false); } }
  async function choose(ref: Ref) { setGeneratedCaption(null); setCard((await post("/api/export", ref)).card); }
  const caption = card ? `${card.text}\n\n${generatedCaption ? `${generatedCaption} [مولّد]\n\n` : ""}${card.reference}\n${card.url}\n${card.disclaimer}` : "";
  async function exportPng() {
    if (!card) return;
    const source: Card = (await post("/api/export", { kind: card.kind, ref: card.ref, language: card.language })).card;
    await document.fonts.ready;
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = format === "story" ? 1920 : 1080;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("المتصفح لا يدعم تصدير PNG.");
    ctx.fillStyle = theme === "green" ? "#174f40" : "#f5f0df"; ctx.fillRect(0, 0, 1080, canvas.height); ctx.fillStyle = theme === "green" ? "#fff9e8" : "#174f40";
    const rtl = ["ar", "ur"].includes(source.language); ctx.direction = rtl ? "rtl" : "ltr"; ctx.textAlign = rtl ? "right" : "left"; const x = rtl ? 995 : 85;
    ctx.font = 'bold 44px "Readex Pro Variable", Tahoma'; ctx.fillText("سَنَد", x, 95);
    let size = 47, lines: string[];
    do { ctx.font = `${size}px "Readex Pro Variable", Tahoma`; lines = wrap(ctx, source.text, 900); size -= 2; } while (lines.length * (size + 2) * 1.7 > canvas.height - 480 && size >= 23);
    if (lines.length * (size + 2) * 1.7 > canvas.height - 480) throw new Error("النص أطول من مساحة البطاقة. اختر المقاس الطولي أو نصًا آخر؛ لن يُقتطع النص.");
    ctx.font = `${size + 2}px "Readex Pro Variable", Tahoma`; lines.forEach((line, i) => ctx.fillText(line, x, 210 + i * (size + 2) * 1.7));
    ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.font = '22px "Readex Pro Variable", Tahoma'; const refs = wrap(ctx, source.reference, 900);
    if (refs.length > 5) throw new Error("مرجع البطاقة أطول من المساحة المتاحة.");
    refs.forEach((line, i) => ctx.fillText(line, 995, canvas.height - 255 + i * 32));
    ctx.direction = "ltr"; ctx.textAlign = "left"; ctx.font = "18px Arial"; ctx.fillText(source.url, 85, canvas.height - 72, 900);
    ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.font = '18px "Readex Pro Variable", Tahoma'; ctx.fillText(source.disclaimer, 995, canvas.height - 32, 900);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("تعذر إنشاء الصورة."); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `sanad-${source.ref.replace(":", "-")}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("تم تنزيل PNG مع المصدر.");
  }
  return <>
    <section className="work-panel">
      <p className="notice">لا يُصدّر الحديث إلا بعد التحقق من ثبوته في الفهرس. اختر اللغة والجمهور بنفسك. النص الشرعي والمرجع من المصدر؛ الوصف الإضافي اختياري وموسوم «مولّد».</p>
      {!publish && <><label htmlFor="source-search">كلمات البحث</label><input id="source-search" maxLength={120} value={query} onChange={e => setQuery(e.target.value)} /><button className="button button-primary" disabled={busy || query.trim().length < 2} onClick={() => void run(async () => setItems((await post("/api/catalog", { query })).items))}>ابحث في المصادر</button></>}
      <label htmlFor="card-lang">اللغة</label><select id="card-lang" value={lang} onChange={e => { setLang(e.target.value); setCard(null); setGeneratedCaption(null); }}><option value="ar">العربية</option><option value="en">English</option><option value="bn">বাংলা</option><option value="ur">اردو</option></select>
      <button className="button" onClick={() => setSaved(readSaved())}>عرض بطاقاتي على الجهاز</button>
      <div className="example-buttons">{saved.map((r, i) => <button className="button" key={i} onClick={() => void run(() => choose(r))}>{r.ref} · {r.language}</button>)}</div>
      <div className="catalog-grid">{items.map(item => <article className="result-card" key={`${item.kind}:${item.ref}`}><small>{item.topic} · {item.ref}</small><p>{item.text}</p><button className="button" onClick={() => void run(() => choose({ kind: item.kind, ref: item.ref, language: lang }))}>اختيار</button></article>)}</div>
    </section>
    {card && <section className="work-panel">
      <label htmlFor="format">مقاس البطاقة</label><select id="format" value={format} onChange={e => setFormat(e.target.value)}><option value="square">مربع 1080 × 1080</option><option value="story">طولي 1080 × 1920</option></select>
      <label htmlFor="theme">القالب</label><select id="theme" value={theme} onChange={e => setTheme(e.target.value)}><option value="green">أخضر</option><option value="paper">ورقي</option></select>
      <div className="card-preview" style={theme === "paper" ? { background: "#f5f0df", color: "#174f40" } : {}}><b>سَنَد</b><blockquote dir="auto">{card.text}</blockquote><small>{card.reference}</small></div>
      {card.glossary.length > 0 && <div className="notice"><b>إرشادات مصطلحية من القاموس</b><p>للمراجعة عند كتابة الوصف؛ لا تغيّر نص البطاقة أو مرجعها.</p><ul>{card.glossary.map(entry => <li key={entry.id}><b>{entry.term}</b> — المفضّل: {entry.preferred.join("، ")}{entry.avoid.length > 0 && <>؛ تجنّب: {entry.avoid.join("، ")}</>}<br /><small>{entry.note}</small></li>)}</ul></div>}
      {audiences.length > 0 && <div className="notice">
        <label htmlFor="card-audience">جمهور الوصف الاختياري</label><select id="card-audience" value={audienceId} onChange={e => { setAudienceId(e.target.value); setGeneratedCaption(null); }}>{audiences.map(a => <option key={a.id} value={a.id}>{a.name_ar}</option>)}</select>
        <p>بالضغط على الزر توافق على إرسال اسم الجمهور المختار إلى Google Gemini لاختيار أسلوب وصف قصير. تعمل الميزة ضمن الحصة المجانية عند توافرها؛ قد تستخدم Google البيانات لتحسين خدماتها. يبقى نص البطاقة من المصدر.</p>
        <button className="button" disabled={busy || !["ar", "en"].includes(card.language)} onClick={() => void run(async () => { const response = await post("/api/localize", { kind: card.kind, ref: card.ref, language: card.language, audienceId, allowGemini: true }); setGeneratedCaption(response.generated.text); setMessage("وصف مولّد محدود الأسلوب، راجعه قبل المشاركة."); })}>اقترح وصفًا مولّدًا</button>
        {generatedCaption && <p>مولّد: {generatedCaption}</p>}{!["ar", "en"].includes(card.language) && <p>الوصف المولّد متاح بالعربية والإنجليزية فقط حتى المراجعة اللغوية.</p>}
      </div>}
      <div className="work-toolbar"><button className="button button-primary" disabled={busy} onClick={() => void run(exportPng)}>تنزيل PNG</button><button className="button" onClick={() => void run(async () => { await navigator.clipboard.writeText(caption); setMessage("نُسخ النص مع المصدر."); })}>نسخ النص والمصدر</button><a className="button" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(caption)}`}>WhatsApp</a><button className="button" onClick={() => void run(async () => { if (!navigator.share) throw new Error("مشاركة الجهاز غير متاحة."); await navigator.share({ title: "سَنَد", text: caption }); })}>مشاركة الجهاز</button><button className="button" onClick={() => { const next = [{ kind: card.kind, ref: card.ref, language: card.language }, ...readSaved().filter(r => r.ref !== card.ref || r.language !== card.language)].slice(0, 30); try { localStorage.setItem("sanad-cards-v1", JSON.stringify(next)); setSaved(next); setMessage("حُفظ مرجع البطاقة على الجهاز."); } catch { setMessage("تعذر الحفظ على الجهاز."); } }}>حفظ على الجهاز</button></div>
    </section>}
    <p role="status">{busy ? "جارٍ العمل…" : message}</p>
  </>;
}
