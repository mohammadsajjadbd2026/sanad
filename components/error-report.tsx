"use client";
import { useState } from "react";
import { reportDraft, reportIssueUrl } from "@/lib/error-report";
export function ErrorReport({ reference = "" }: { reference?: string }) {
  const [details, setDetails] = useState(""), [ref, setRef] = useState(reference), [consent, setConsent] = useState(false), [draft, setDraft] = useState(""), [message, setMessage] = useState("");
  return <details className="error-report"><summary>أبلغ عن خطأ</summary>
    <p>صف المشكلة وأضف مرجعها دون بيانات شخصية. لا تُرسل هذه الخانات إلى خادم سَنَد ولا يُرفق نص محادثتك تلقائيًا.</p>
    <label>المرجع أو معرّف المصدر<input value={ref} maxLength={250} onChange={e => { setRef(e.target.value); setDraft(""); }} /></label>
    <label>وصف الخطأ<textarea value={details} maxLength={1500} rows={4} onChange={e => { setDetails(e.target.value); setDraft(""); }} /></label>
    <button className="button" disabled={details.trim().length < 5} onClick={() => { setDraft(reportDraft(details.trim(), ref, window.location.pathname)); setConsent(false); setMessage(""); }}>معاينة البلاغ</button>
    {draft && <><pre className="report-preview">{draft}</pre><p>يمكنك نسخ البلاغ وإرساله لفريق المشروع بالطريقة المتفق عليها، أو فتح مسودة على GitHub. فتح المسودة يرسل محتواها إلى GitHub، ونشرها يجعلها علنية ويتطلب حسابًا. لم يُرسل البلاغ بعد.</p>
      <label className="consent-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />أوافق على نقل هذا البلاغ إلى GitHub وأفهم أنه سيصبح عامًا إذا نشرته.</label>
      <div className="work-toolbar"><button className="button" onClick={async () => { try { await navigator.clipboard.writeText(draft); setMessage("نُسخت المسودة؛ لم تُرسل بعد."); } catch { setMessage("تعذر النسخ؛ انسخ نص المعاينة يدويًا."); } }}>نسخ البلاغ</button>
      {consent && <a className="button button-primary" href={reportIssueUrl(draft)} target="_blank" rel="noreferrer">فتح المسودة على GitHub ↗</a>}</div></>}
    <p role="status">{message}</p>
  </details>;
}
