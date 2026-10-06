import { readJson, RequestError, errorResponse } from "@/lib/http";
import { libraryRequest, searchLibrary } from "@/lib/library/search";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const parsed = libraryRequest.safeParse(await readJson(request, 3000));
    if (!parsed.success) throw new RequestError("راجع عبارة البحث واختيارات المصدر.");
    return Response.json(await searchLibrary(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
