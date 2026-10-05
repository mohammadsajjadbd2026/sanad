import Link from "next/link";
import { CardStudio } from "@/components/card-studio";
import { WorkPage } from "@/components/work-page";
export const metadata = { title: "انشر — بطاقاتي" };
export default function Page() { return <WorkPage title="انشر · ليصل المحتوى ومعه سنده" subtitle="استرجع بطاقات جهازك، وأعد التحقّق من مرجعها قبل التنزيل."><Link className="button button-primary" href="/produce">إنشاء بطاقة جديدة</Link><CardStudio publish /></WorkPage>; }
