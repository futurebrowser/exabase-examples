export const baseKeys = {
  all: ["base"] as const,
  documents: (baseId: string) =>
    [...baseKeys.all, baseId, "documents"] as const,
  flashcards: (baseId: string) =>
    [...baseKeys.all, baseId, "flashcards"] as const,
};
