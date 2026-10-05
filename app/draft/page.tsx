import { DraftWorkbench } from "@/components/draft-workbench";
import { WorkPage } from "@/components/work-page";
import { loadQuran } from "@/lib/sources/quran";
import { loadHadith } from "@/lib/sources/hadith";
export const metadata = { title: "أعِدّ — مدقّق النصوص" };
export default async function Page() {
  const [quran, hadith] = await Promise.all([loadQuran(), loadHadith()]);
  const examples = [{ title: "مثال قرآني من المصدر", text: quran.get("112:1")!.text }, { title: "حديث من الفهرس", text: hadith.records[0].text_ar }, { title: "سؤال فتوى شخصية", text: "هل يجوز لي أن أفعل ذلك في حالتي الشخصية؟" }];
  return <WorkPage title="أعِدّ · اطمئنّ إلى ما تنقل" subtitle="تقرير واضح، وحكم من المصدر لا من النموذج."><DraftWorkbench examples={examples} /></WorkPage>;
}
