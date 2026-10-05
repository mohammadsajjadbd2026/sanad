import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import "@fontsource-variable/readex-pro";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { disclaimer } from "@/lib/journey";

export const metadata: Metadata = {
  title: { default: "سَنَد — معرفة تُنقل بثقة", template: "%s | سَنَد" },
  description: "رحلة المعرّف بالإسلام من الاستعداد إلى الميدان. منصة تربط المحتوى بمصادره، وتُظهر حدود التحقق بوضوح.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
        <div className="disclaimer"><Info size={14} aria-hidden="true" /><span>{disclaimer}</span></div>
        <Navigation />
        <main id="main-content">{children}</main>
        <footer className="site-footer container">
          <div><strong>سَنَد</strong><span>النموذج يقترح، والمصدر وحده يحكم.</span></div>
          <div className="footer-links"><Link href="/about">المنهج والمصادر</Link><span>نسخة أولية · ٢٠٢٦</span></div>
        </footer>
      </body>
    </html>
  );
}
