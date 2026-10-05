import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { StationIcon } from "@/components/icons";
import { getStation, stations } from "@/lib/journey";

export const dynamicParams = false;
export function generateStaticParams() { return stations.map(({ slug }) => ({ station: slug })); }
type Props = { params: Promise<{ station: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const station = getStation((await params).station);
  return { title: station?.name ?? "الصفحة غير موجودة" };
}

export default async function StationPage({ params }: Props) {
  const station = getStation((await params).station);
  if (!station) notFound();
  const index = stations.findIndex(s => s.slug === station.slug);
  const next = stations[index + 1];
  return (
    <div className={`container station-page accent-${station.accent}`}>
      <Link href="/#journey" className="back-link"><ArrowRight size={16} aria-hidden="true" /> جميع المحطات</Link>
      <div className="station-intro"><span className="station-icon large"><StationIcon name={station.icon} size={30} /></span><span className="eyebrow">المحطة {station.number} · {station.name}</span><h1>{station.title}</h1><p>{station.description}</p></div>
      <section className="coming-panel"><span className="availability"><Clock3 size={16} aria-hidden="true" /> قيد البناء</span><h2>هذه المحطة في الخطوة التالية</h2><p>{station.detail}</p><div className="planned-output"><span>ما ستحصل عليه</span><strong>{station.deliverable}</strong></div><p className="honesty-note">هذه صفحة تعريفية بالوظيفة المخطّطة. لم يُفعّل التحقّق أو التوليد أو تصدير البطاقات بعد.</p></section>
      <div className="station-page-footer"><Link href="/about"><ShieldCheck size={18} aria-hidden="true" /> اقرأ منهج التحقّق وحدوده</Link>{next && <Link href={`/${next.slug}`}>المحطة التالية: {next.name}<ArrowLeft size={17} aria-hidden="true" /></Link>}</div>
    </div>
  );
}
