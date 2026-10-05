import { CardStudio } from "@/components/card-studio";
import { WorkPage } from "@/components/work-page";
export const metadata = { title: "أنتِج — بطاقة موثّقة" };
export default function Page() { return <WorkPage title="أنتِج · بطاقة تحمل مصدرها" subtitle="اختر النص واللغة، ثم صمّم بطاقة قابلة للمشاركة."><CardStudio /></WorkPage>; }
