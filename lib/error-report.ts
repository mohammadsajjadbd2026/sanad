export function reportDraft(details: string, reference: string, path: string) {
  return `بلاغ سَنَد\n\nالصفحة: ${path.slice(0, 150)}\nالمرجع: ${reference.slice(0, 250)}\n\nوصف المشكلة:\n${details.slice(0, 1500)}\n\nالبلاغ للمراجعة البشرية؛ لا يغيّر نص المصدر تلقائيًا.`;
}
export function reportIssueUrl(draft: string) {
  return `https://github.com/mohammadsajjadbd2026/sanad/issues/new?${new URLSearchParams({ title: "بلاغ عن خطأ في سَنَد", body: draft })}`;
}
