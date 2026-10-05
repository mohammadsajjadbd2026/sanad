import Link from "next/link";

export default function NotFound() {
  return <div className="container not-found"><span className="eyebrow">٤٠٤</span><h1>هذه الصفحة غير موجودة</h1><p>يمكنك العودة إلى الرئيسية واختيار إحدى محطات الرحلة.</p><Link className="button button-primary" href="/">العودة إلى سَنَد</Link></div>;
}
