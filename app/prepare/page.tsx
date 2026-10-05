import { readFile } from "node:fs/promises";
import { DialogueTrainer } from "@/components/dialogue-trainer";
import { WorkPage } from "@/components/work-page";
import { loadBayyinat } from "@/lib/sources/bayyinat";
export const metadata = { title: "استعدّ — تدريب الحوار" };
export default async function Page() { const questions = (await loadBayyinat()).records; const audiences = (JSON.parse(await readFile("data/audiences.json", "utf8")) as { id: string; name_ar: string; language: string }[]).filter(a => !["a-02", "a-03"].includes(a.id)); return <WorkPage title="استعدّ · تدرب على الحوار" subtitle="سؤال من بيّنات، وإجابتك، ثم مقارنة مباشرة مع المصدر."><DialogueTrainer questions={questions} audiences={audiences} /></WorkPage>; }
