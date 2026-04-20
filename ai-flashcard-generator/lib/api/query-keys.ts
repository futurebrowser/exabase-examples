export const workspaceKeys = {
  all: ["workspace"] as const,
  documents: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId, "documents"] as const,
  flashcards: (workspaceId: string) =>
    [...workspaceKeys.all, workspaceId, "flashcards"] as const,
};
