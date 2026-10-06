import { LibrarySearch } from "@/components/library-search";
import { WorkPage } from "@/components/work-page";
export const metadata = { title: "المكتبة — بحث موحّد في المصادر" };
export default function Page() { return <WorkPage title="المكتبة والمراجع" subtitle="ابحث، واقرأ السياق، واحتفظ بالإحالة إلى أصل النص."><LibrarySearch /></WorkPage>; }
