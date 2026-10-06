export type LibraryItem = { id: string; provider: "local" | "khizana" | "islamhouse"; title: string; text: string; citation: string; language: string; url?: string; bookId?: number; pageId?: number };
export type LibraryGroup = { provider: LibraryItem["provider"]; items: LibraryItem[]; note: string; error?: string; nextPage?: number };
export type LibraryResponse = { groups: LibraryGroup[] };
