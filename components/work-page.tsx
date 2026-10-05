import Link from "next/link";
export function WorkPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="container work-page"><Link href="/" className="back-link">← رحلة سَنَد</Link><span className="eyebrow">من المصدر إلى الأثر</span><h1>{title}</h1><p className="page-lead">{subtitle}</p>{children}</div>;
}
