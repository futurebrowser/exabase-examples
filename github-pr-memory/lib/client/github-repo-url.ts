const key = (baseId: string) => `githubPrMemory:repoUrl:${baseId}` as const;

export function getStoredRepoUrl(baseId: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(key(baseId));
  } catch {
    return null;
  }
}

export function setStoredRepoUrl(baseId: string, repoUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key(baseId), repoUrl.trim());
  } catch {
    // ignore
  }
}
