"use client";
import Link from "next/link";
import { useState } from "react";
import type { LibraryItem, LibraryResponse } from "@/lib/library/types";
import { ErrorReport } from "./error-report";
const names = { local: "مصادر سَنَد المحلية", khizana: "خزانة المعارف · MCP", islamhouse: "دار الإسلام · IslamHouse API" };
type PageResult = { book: string; author: string; pages: { page_id: number; location: string; text: string; footnotes?: string | null }[]; "تنبيه_التحديث"?: string };
function LibraryCard({ item, external }: { item: LibraryItem; external: boolean }) {
  const [page, setPage] = useState<PageResult | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function readPage() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/library/page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: item.bookId, pageId: item.pageId, external }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error); setPage(body);
    } catch { setMessage("تعذرت قراءة الصفحة الآن. لم تُعتمد إحالة جديدة."); } finally { setBusy(false); }
  }
  const citation = `${item.title} · ${item.citation}`;
  return <article className="result-card library-card">
    <span className="status-label">{item.provider === "local" ? "نتيجة بحث — ليست حكم تحقق" : "نقل من مصدر خارجي — غير معتمد تلقائيًا"}</span>
    <h3 dir="auto">{item.title}</h3><p dir="auto">{item.citation}</p>
    <div className="library-excerpt" dir="auto" lang={item.language}>{item.text}</div>
    <div className="work-toolbar">
      {item.provider === "khizana" && <button className="button" disabled={busy || !external} onClick={() => void readPage()}>{busy ? "جارٍ فتح السياق…" : "اقرأ الصفحة والسياق"}</button>}
      {item.url && <a className="button" href={item.url} target="_blank" rel="noreferrer">فتح المادة في المصدر ↗</a>}
      {item.provider !== "khizana" && <button className="button" onClick={async () => { try { await navigator.clipboard.writeText(`${item.text}\n${citation}${item.url ? `\n${item.url}` : ""}`); setMessage("نُسخ النص مع إحالته."); } catch { setMessage("تعذر النسخ؛ يمكنك تحديد النص يدويًا."); } }}>نسخ النص والمرجع</button>}
      <Link className="button" href="/draft">افتح المدقّق</Link>
    </div>
    {page && <section className="library-page" aria-label="نص الصفحة من خزانة المعارف"><h4>{page.book} · {page.author}</h4><p className="notice">نص الصفحة كما أعاده المصدر، وليس حكمًا شرعيًا أو بحثًا مستقصيًا. قد يكون النص محدودًا بميزانية الاستجابة؛ لا نعتمد اكتماله تلقائيًا.</p>{page["تنبيه_التحديث"] && <p role="status">{page["تنبيه_التحديث"]}</p>}{page.pages.map(p => <div key={p.page_id}><strong>{p.location}</strong><div className="library-page-text" dir="auto">{p.text}</div>{p.footnotes && <><h4>حواشٍ — لا تُنسب تلقائيًا للمؤلف</h4><div className="library-page-text">{p.footnotes}</div></>}</div>)}<button className="button" onClick={() => setPage(null)}>إغلاق السياق</button></section>}
    <p role="status">{message}</p><ErrorReport reference={`${item.id} · ${citation}`} />
  </article>;
}
export function LibrarySearch() {
  const [query, setQuery] = useState(""), [external, setExternal] = useState(false), [language, setLanguage] = useState("ar"), [type, setType] = useState("showall");
  const [result, setResult] = useState<LibraryResponse | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function search(page = 1, onlyIslamhouse = false) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, external, language, type, page, onlyIslamhouse }) });
      const body: LibraryResponse & { error?: string } = await response.json(); if (!response.ok) throw new Error(body.error);
      setResult(previous => onlyIslamhouse && previous ? { groups: [...previous.groups.filter(g => g.provider !== "islamhouse"), ...body.groups] } : body);
    } catch { setMessage("تعذر البحث الآن. حاول لاحقًا."); } finally { setBusy(false); }
  }
  return <>
    <form className="work-panel" onSubmit={e => { e.preventDefault(); if (!busy) void search(); }}><fieldset className="library-controls" disabled={busy}>
      <p className="notice">البحث يجمع مصادر سَنَد وخزانة المعارف ومواد دار الإسلام في واجهة واحدة. لا يولّد نصًا دينيًا ولا يستخدم Gemini. نتيجة البحث لا تعني صحة الحديث أو صلاحية الاستدلال.</p>
      <label htmlFor="library-query">كلمات البحث أو العبارة</label><input id="library-query" dir="auto" value={query} maxLength={200} onChange={e => { setQuery(e.target.value); setResult(null); }} placeholder="مثال: إنما الأعمال بالنيات" />
      <label className="consent-row"><input type="checkbox" checked={external} onChange={e => { setExternal(e.target.checked); setResult(null); }} />أوافق على البحث الخارجي: تُرسل العبارة إلى خزانة المعارف، واللغة والنوع ورقم الصفحة إلى IslamHouse. قد يسجل المزودان الطلبات؛ لا تدخل معلومات شخصية. خزانة المعارف تبحث في نصوص عربية.</label>
      {external && <div className="library-filters"><label>لغة مواد IslamHouse<select value={language} onChange={e => { setLanguage(e.target.value); setResult(null); }}>{Object.entries({ ar: "العربية", en: "English", bn: "বাংলা", ur: "اردو" }).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>نوع مواد IslamHouse<select value={type} onChange={e => { setType(e.target.value); setResult(null); }}>{Object.entries({ showall: "جميع الأنواع", books: "كتب", articles: "مقالات", audios: "صوتيات", videos: "مرئيات" }).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label></div>}
      <p>مصادر سَنَد: بحث لفظي · الخزانة: بحث في النصوص · IslamHouse: تصفية صفحة من فهرس المواد، لا بحث شامل. العبارة الفارغة تعرض مواد IslamHouse للتصفح.</p>
      <button className="button button-primary" disabled={busy || (!external && query.trim().length < 2)}>{busy ? "جارٍ البحث…" : "ابحث في المصادر"}</button>
    </fieldset></form>
    <p role="status" aria-live="polite">{message || (busy ? "جارٍ جلب النتائج…" : result ? "اكتمل الطلب؛ حالة كل مصدر موضّحة أدناه." : "")}</p>
    {result?.groups.map(group => <section key={group.provider} className="library-group"><h2>{names[group.provider]}</h2><p className="notice">{group.error || group.note}</p>{!group.error && group.items.length === 0 && <p>لا نتائج في النطاق المعروض. هذا لا يثبت غياب النص من جميع المصادر.</p>}{group.items.map(item => <LibraryCard key={item.id} item={item} external={external} />)}{group.nextPage && <button className="button" disabled={busy || !external} onClick={() => void search(group.nextPage, true)}>الصفحة التالية من IslamHouse</button>}</section>)}
    <p className="notice">المصادر الخارجية تجريبية وخاضعة لحصصها؛ لا ننزّل المكتبات كاملة ولا نعدّل ملفات سَنَد الأصلية. <a href="https://khizanat-almaarif.com/" target="_blank" rel="noreferrer">عن الخزانة</a> · <a href="https://islamhouse.com/" target="_blank" rel="noreferrer">IslamHouse.com</a></p>
  </>;
}
