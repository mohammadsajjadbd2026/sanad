import "server-only";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type SearchDocument, sha256 } from "./corpus";
import { normalizeVector } from "./math";
import { EmbeddingProviderError } from "../llm/embeddings";

const FORMAT_VERSION = 1;
const SHARD_SIZE = 100;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export type StoredEmbedding = { id: string; sourceHash: string; values: number[] };
type Shard = { version: number; profile: string; entries: StoredEmbedding[] };
export type BuildResult = { profile: string; total: number; completed: number; created: number; reused: number; complete: boolean; model: string; dimensions: number };
type Options = {
  outputRoot: string; model: string; dimensions: number;
  selectedIds?: readonly string[]; batchSize?: number; delayMs?: number;
  embed: (text: string) => Promise<number[]>;
  onProgress?: (completed: number, target: number) => void;
  onRetry?: (attempt: number) => void;
  wait?: (ms: number) => Promise<void>;
};

export async function retryEmbedding<T>(action: () => Promise<T>, wait = sleep, onRetry?: (attempt: number) => void): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await action(); }
    catch (error) {
      if (!(error instanceof EmbeddingProviderError) || !error.retryable || attempt >= 3) throw error;
      onRetry?.(attempt + 1);
      await wait(Math.min(30_000, 2_000 * 2 ** attempt));
    }
  }
}

async function atomicJson(file: string, value: unknown) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value), "utf8");
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function isMissing(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"; }
export function corpusProfile(documents: readonly SearchDocument[], model: string, dimensions: number) {
  return sha256(JSON.stringify({ version: FORMAT_VERSION, inputFormat: "retrieval-v1", model, dimensions, corpus: documents.map(d => [d.id, d.hash]) }));
}

/** Writes generated vectors only. Never edits the source corpus. Sample and full runs share checkpoints. */
export async function buildEmbeddingIndex(documents: readonly SearchDocument[], options: Options): Promise<BuildResult> {
  if (!documents.length || new Set(documents.map(d => d.id)).size !== documents.length) throw new Error("مجموعة المصادر فارغة أو تحوي معرّفات مكررة");
  if (!Number.isInteger(options.dimensions) || options.dimensions < 1) throw new Error("أبعاد غير صالحة");
  const batchSize = options.batchSize ?? 5; const delayMs = options.delayMs ?? 1_000;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100 || !Number.isFinite(delayMs) || delayMs < 0) throw new Error("إعداد دفعات غير صالح");
  const profile = corpusProfile(documents, options.model, options.dimensions);
  const directory = path.join(options.outputRoot, profile);
  await mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, "build.lock");
  let lock;
  try { lock = await open(lockPath, "wx"); }
  catch { throw new Error("هناك بناء جارٍ أو قفل من تشغيل متوقف. تحقّق من توقف العملية قبل إزالة build.lock."); }
  try {
    await lock.writeFile(String(process.pid));
    const indexById = new Map(documents.map((d, i) => [d.id, i]));
    const selected = options.selectedIds ? new Set(options.selectedIds) : new Set(indexById.keys());
    for (const id of selected) if (!indexById.has(id)) throw new Error("العينة تحوي معرّفًا خارج المصادر");
    if (!selected.size) throw new Error("عينة فارغة");
    const entries = new Map<string, StoredEmbedding>();
    const shardSchema = z.object({ version: z.literal(FORMAT_VERSION), profile: z.literal(profile), entries: z.array(z.object({
      id: z.string(), sourceHash: z.string(), values: z.array(z.number().finite()).length(options.dimensions),
    })) });
    const shardFile = (index: number) => path.join(directory, `shard-${String(index).padStart(5, "0")}.json`);
    for (let shardIndex = 0; shardIndex < Math.ceil(documents.length / SHARD_SIZE); shardIndex++) {
      let raw: string;
      try { raw = await readFile(shardFile(shardIndex), "utf8"); }
      catch (error) { if (isMissing(error)) continue; throw error; }
      let shard: Shard;
      try { shard = shardSchema.parse(JSON.parse(raw)); }
      catch { throw new Error("ملف بصمات غير صالح؛ لا يمكن الاستئناف منه"); }
      for (const entry of shard.entries) {
        const sourceIndex = indexById.get(entry.id);
        if (sourceIndex === undefined || Math.floor(sourceIndex / SHARD_SIZE) !== shardIndex || documents[sourceIndex].hash !== entry.sourceHash || entries.has(entry.id)) throw new Error("بصمة لا تطابق مصدرها أو مكررة");
        normalizeVector(entry.values, options.dimensions);
        entries.set(entry.id, entry);
      }
    }
    let completed = [...selected].filter(id => entries.has(id)).length;
    const reused = completed; let created = 0;
    const pending = documents.filter(d => selected.has(d.id) && !entries.has(d.id));
    options.onProgress?.(completed, selected.size);
    for (let offset = 0; offset < pending.length; offset += batchSize) {
      const batch = pending.slice(offset, offset + batchSize);
      // Sequential requests respect small API quotas. Every successful item is checkpointed.
      for (const document of batch) {
        const vector = await retryEmbedding(() => options.embed(document.text), options.wait ?? sleep, options.onRetry);
        const entry = { id: document.id, sourceHash: document.hash, values: normalizeVector(vector, options.dimensions) };
        entries.set(document.id, entry);
        const shardIndex = Math.floor(indexById.get(document.id)! / SHARD_SIZE);
        const shardDocuments = documents.slice(shardIndex * SHARD_SIZE, (shardIndex + 1) * SHARD_SIZE);
        await atomicJson(shardFile(shardIndex), { version: FORMAT_VERSION, profile, entries: shardDocuments.flatMap(d => entries.has(d.id) ? [entries.get(d.id)!] : []) });
        created++; completed++;
        options.onProgress?.(completed, selected.size);
        if (completed < selected.size && delayMs > 0) await (options.wait ?? sleep)(delayMs);
      }
    }
    const result: BuildResult = { profile, total: documents.length, completed: entries.size, created, reused, complete: entries.size === documents.length, model: options.model, dimensions: options.dimensions };
    await atomicJson(path.join(directory, "manifest.json"), { version: FORMAT_VERSION, ...result, shardSize: SHARD_SIZE });
    // A sample never replaces the active full index, even for very small corpora.
    if (result.complete && !options.selectedIds) await atomicJson(path.join(options.outputRoot, "active.json"), { version: FORMAT_VERSION, profile });
    return result;
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

export async function readCompletedIndex(outputRoot: string, documents: readonly SearchDocument[], model: string, dimensions: number): Promise<StoredEmbedding[]> {
  const profile = corpusProfile(documents, model, dimensions);
  const active = z.object({ version: z.literal(FORMAT_VERSION), profile: z.literal(profile) }).parse(JSON.parse(await readFile(path.join(outputRoot, "active.json"), "utf8")));
  const directory = path.join(outputRoot, active.profile);
  const manifest = z.object({ complete: z.literal(true), profile: z.literal(profile), total: z.literal(documents.length), model: z.literal(model), dimensions: z.literal(dimensions) });
  manifest.parse(JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8")));
  const result: StoredEmbedding[] = [];
  for (let index = 0; index < Math.ceil(documents.length / SHARD_SIZE); index++) {
    const shard = z.object({ version: z.literal(FORMAT_VERSION), profile: z.literal(profile), entries: z.array(z.object({ id: z.string(), sourceHash: z.string(), values: z.array(z.number().finite()).length(dimensions) })) }).parse(JSON.parse(await readFile(path.join(directory, `shard-${String(index).padStart(5, "0")}.json`), "utf8")));
    result.push(...shard.entries);
  }
  if (result.length !== documents.length) throw new Error("الفهرس الدلالي غير مكتمل");
  result.forEach((entry, index) => {
    if (entry.id !== documents[index].id || entry.sourceHash !== documents[index].hash) throw new Error("الفهرس الدلالي لا يطابق المصادر الحالية");
    normalizeVector(entry.values, dimensions);
  });
  return result;
}
