const OWNER_REPO = /github\.com\/([^/]+)\/([^/#?]+)/i;

/**
 * Resolves `owner` and `repo` from a browser or `api.github.com` style URL.
 * Strips a trailing `.git` segment if present.
 */
export function parseOwnerRepoFromInput(input: string): {
  owner: string;
  repo: string;
} | null {
  const t = input.trim();
  if (!t) {
    return null;
  }
  const m = t.match(OWNER_REPO);
  if (!m?.[1] || !m[2]) {
    return null;
  }
  const owner = m[1];
  const repo = m[2].replace(/\.git$/i, "");
  if (!owner || !repo) {
    return null;
  }
  return { owner, repo };
}
