export function normalizeVector(vector: readonly number[], dimensions: number): number[] {
  if (vector.length !== dimensions || vector.some(n => !Number.isFinite(n))) throw new Error("بصمة دلالية غير صالحة");
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm === 0) throw new Error("بصمة دلالية صفرية أو غير صالحة");
  return vector.map(value => value / norm);
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) throw new Error("أبعاد البصمتين غير متوافقة");
  const left = normalizeVector(a, a.length); const right = normalizeVector(b, b.length);
  return Math.max(-1, Math.min(1, left.reduce((sum, value, index) => sum + value * right[index], 0)));
}
