"use client";
import { useState } from "react";
import type { Report } from "@/lib/verify/types";
import { VerificationReport } from "./report";
export function DraftWorkbench({ examples }: { examples: { title: string; text: string }[] }) {
  const [text, setText] = useState(""), [report, setReport] = useState<Report | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function check() {
    setBusy(true); setError(""); setReport(null);
    try { const response = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); const value = await response.json(); if (!response.ok) throw new Error(value.error); setReport(value); }
    catch (error) { setError(error instanceof Error ? error.message : "تعذر الاتصال."); } finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setError(""); setReport(null);
    if (file.size > 500000) { setError("اختر ملفًا أصغر من 500 كيلوبايت."); return; }
    try {
      let value: string;
      if (file.name.toLowerCase().endsWith(".txt")) value = await file.text();
      else if (file.name.toLowerCase().endsWith(".docx")) { const mammoth = await import("mammoth"); value = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
      else throw new Error("ندعم ملفات TXT وDOCX فقط.");
      if (value.length > 12000) throw new Error("نص الملف يتجاوز 12000 حرف. انسخ الجزء المطلوب فقط.");
      setText(value);
    } catch (error) { setError(error instanceof Error ? error.message : "تعذرت قراءة الملف."); }
  }
  return <><section className="work-panel"><p className="notice">ضع اقتباسًا في كل سطر، أو بين «علامتي اقتباس». المطابقة المحافظة قد تمتنع عن النصوص المختصرة أو المعاد صياغتها. الملف يُقرأ في متصفحك ولا يُرفع؛ النص فقط يصل لخادم التحقّق المحلي.</p><div className="example-buttons">{examples.map(e => <button className="button" key={e.title} onClick={() => { setText(e.text); setReport(null); }}>{e.title}</button>)}</div><label htmlFor="draft-text">النص المراد مراجعته</label><textarea id="draft-text" dir="auto" rows={9} maxLength={12000} value={text} onChange={e => { setText(e.target.value); setReport(null); }} placeholder="الصق النص هنا…" /><div className="work-toolbar"><label className="button file-input">رفع TXT / DOCX<input aria-label="رفع ملف نصي" type="file" accept=".txt,.docx" onChange={e => void upload(e.target.files?.[0])} /></label><span>{text.length} / 12000</span><button className="button button-primary" disabled={busy || !text.trim()} onClick={() => void check()}>{busy ? "جارٍ التحقّق…" : "تحقّق من النص"}</button></div><p role="alert">{error}</p></section><div aria-live="polite">{report && <VerificationReport report={report} />}</div></>;
}
