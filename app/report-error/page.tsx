import { ErrorReport } from "@/components/error-report";
import { WorkPage } from "@/components/work-page";
export const metadata = { title: "أبلغ عن خطأ" };
export default function Page() { return <WorkPage title="أبلغ عن خطأ" subtitle="ساعدنا على تحسين سَنَد؛ البلاغ يُراجع بشريًا ولا يغيّر المصدر تلقائيًا."><section className="work-panel"><ErrorReport /></section></WorkPage>; }
