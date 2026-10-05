"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { stations } from "@/lib/journey";

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="سَنَد — الرئيسية" onClick={() => setOpen(false)}>
          <span className="brand-mark"><BookOpen size={25} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="brand-word">سَنَد<span>معرفة تُنقل بثقة</span></span>
        </Link>
        <button className="menu-toggle" aria-label={open ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav id="main-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label="التنقل الرئيسي" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          {[{ href: "/", label: "الرئيسية" }, ...stations.map(s => ({ href: `/${s.slug}`, label: s.name })), { href: "/about", label: "عن سَنَد" }].map(item => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>
          ))}
        </nav>
        <Link className="header-action" href="/draft">استكشف المدقّق <ArrowLeft size={16} aria-hidden="true" /></Link>
      </div>
    </header>
  );
}
