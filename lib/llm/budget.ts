import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
// Development-only ledger. Single process, no parallel writers. UTF-8 bytes are a
// deliberately high estimate for input tokens; reserve failures/retries too.
let queue = Promise.resolve();
export function reserveDevelopmentCost(usd: number) {
  const file = process.env.SANAD_BUDGET_FILE;
  if (!file) return Promise.reject(new Error("يلزم سجل ميزانية محلي قبل إرسال أي طلب تطوير."));
  const operation = queue.then(async () => {
    await mkdir(path.dirname(file), { recursive: true });
    let reserved = 0.01; // reserve the earlier 20-item sample conservatively
    try { const prior = JSON.parse(await readFile(file, "utf8")); if (typeof prior.reservedUsd !== "number" || !Number.isFinite(prior.reservedUsd)) throw new Error("invalid ledger"); reserved = prior.reservedUsd; }
    catch (error) { if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error; }
    if (!Number.isFinite(usd) || usd < 0 || reserved + usd > 4) throw new Error("توقف الطلب قبل تجاوز احتياطي الميزانية: 4 دولارات طلبات + دولار احتياط. لا تعِد ضبط السجل.");
    await writeFile(file, JSON.stringify({ reservedUsd: reserved + usd, ceilingUsd: 4, userTotalBudgetUsd: 5, note: "حجز تقديري محافظ، لا يمثل فاتورة Google؛ يشمل الطلبات الفاشلة والعينة السابقة." }, null, 2));
  });
  queue = operation.catch(() => undefined);
  return operation;
}
