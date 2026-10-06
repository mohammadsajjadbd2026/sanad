"use client";
import { useState } from "react";
type Result = { match: null | { id: string; question_ar: string; answer_ar: string; page: string }; related: { status: string; ref?: string; sourceText?: string; url?: string }[]; suggestions?: { id: string; question_ar: string; page: string }[]; note: string };
export function PracticeSearch() {
  const [question, setQuestion] = useState(""), [result, setResult] = useState<Result | null>(null), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [allowGemini, setAllowGemini] = useState(false);
  async function search(selectedId?: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/practice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, allowGemini, ...(selectedId ? { selectedId } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setResult(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر البحث."); }
    finally { setBusy(false); }
  }
  return <>
    <section className="work-panel">
      <p className="notice">ابحث بالعربية محليًا، أو استخدم Gemini اختياريًا لاقتراح أسئلة قريبة من بحثك بالعربية أو الإنجليزية أو البنغالية أو الأردية. الأجوبة تبقى بالعربية كما وردت في بيّنات.</p>
      <label htmlFor="field-question">السؤال الذي تواجهه</label>
      <textarea id="field-question" dir="auto" value={question} onChange={e => { setQuestion(e.target.value); setResult(null); }} maxLength={500} rows={4} />
      <label className="consent-row" htmlFor="field-consent"><input id="field-consent" type="checkbox" checked={allowGemini} onChange={e => setAllowGemini(e.target.checked)} />أوافق على إرسال سؤال بحثي وعناوين أسئلة بيّنات إلى Google Gemini لترشيح أسئلة موجودة. قد تستخدم Google بيانات الحصة المجانية لتحسين خدماتها؛ لا تدخل بيانات شخصية أو سرية.</label>
      <button className="button button-primary" disabled={busy || question.trim().length < 3} onClick={() => void search()}>{busy ? "جارٍ البحث…" : "اعرض أقرب جواب"}</button>
    </section>
    <p role="alert">{message}</p>
    {result && <section className="result-card"><p className="notice">{result.note}</p>
      {result.suggestions?.map(q => <article key={q.id}><h2>{q.question_ar}</h2><p>بيّنات · ص {q.page}</p><button className="button" disabled={busy} onClick={() => void search(q.id)}>هذا هو السؤال المقصود — اعرض المصدر</button></article>)}
      {result.match && <><h2>{result.match.question_ar}</h2><blockquote>{result.match.answer_ar}</blockquote><p>كتاب بيّنات · ص {result.match.page} · {result.match.id}</p></>}
      {result.related.length > 0 && <><h3>نصوص موثّقة ذات صلة لفظية</h3>{result.related.map((row, i) => <p key={i}>{row.sourceText} · {row.ref} {row.url && <a href={row.url} target="_blank" rel="noreferrer">المصدر ↗</a>}</p>)}</>}
    </section>}
  </>;
}
