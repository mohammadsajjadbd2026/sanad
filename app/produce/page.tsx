import { readFile } from "node:fs/promises";
import { CardStudio } from "@/components/card-studio";
import { WorkPage } from "@/components/work-page";

export const metadata = { title: "أنتِج — بطاقة موثّقة" };

export default async function Page() {
  const allAudiences = JSON.parse(await readFile("data/audiences.json", "utf8")) as {
    id: string;
    name_ar: string;
    language: string;
  }[];
  const audiences = allAudiences.filter((audience) => !["a-02", "a-03"].includes(audience.id));
  return (
    <WorkPage title="أنتِج · بطاقة تحمل مصدرها" subtitle="اختر النص واللغة، ثم صمّم بطاقة قابلة للمشاركة.">
      <CardStudio audiences={audiences} />
    </WorkPage>
  );
}
