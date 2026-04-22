import "server-only";

import { hasOpenAiKey } from "@/lib/ai";
import { getExabase } from "@/lib/exabase-server";
import { parseOwnerRepoFromInput } from "@/lib/github/parseRepoUrl";
import { synthesizePrReviewMemories } from "@/lib/server/synthesize-pr-review-memories";

const API_VERSION = "2022-11-28";
const MAX_PRS = 5;
/** Cap memories persisted after AI synthesis. */
const MAX_MEMORIES = 100;
const MAX_BODY = 4_000;
const MAX_RAW_BLOCKS = 400;
const MAX_THREAD_CHARS = 100_000;

type GhUser = { login: string } | null;

type GhComment = {
  user: GhUser;
  body: string | null;
  created_at: string;
  path?: string;
  html_url?: string;
};

function githubHeaders(): Headers {
  const h = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
  });
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  return h;
}

async function ghGetJson<T>(url: string): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data };
}

function trimBody(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_BODY) {
    return t;
  }
  return `${t.slice(0, MAX_BODY - 1)}…`;
}

function lineForIssueComment(pr: number, c: GhComment): string | null {
  const user = c.user?.login?.trim() ?? "unknown";
  if (!c.body?.trim()) {
    return null;
  }
  return [
    `PR #${pr} — [issue comment] @${user} (${c.created_at})`,
    "",
    trimBody(c.body),
  ].join("\n");
}

function lineForReviewComment(
  pr: number,
  path: string | null | undefined,
  c: GhComment,
): string | null {
  const user = c.user?.login?.trim() ?? "unknown";
  if (!c.body?.trim()) {
    return null;
  }
  const p = (path ?? c.path ?? "file").trim() || "file";
  return [
    `PR #${pr} — [review] @${user} on /${p}`,
    `(${c.created_at})`,
    "",
    trimBody(c.body),
  ].join("\n");
}

type Pull = {
  number: number;
};
type SearchIssuesResponse = { items?: Pull[] };

function tryPushPart(parts: string[], part: string, totalChars: { n: number }) {
  if (parts.length >= MAX_RAW_BLOCKS) {
    return false;
  }
  const sep = parts.length === 0 ? 0 : 2;
  if (totalChars.n + sep + part.length > MAX_THREAD_CHARS) {
    return false;
  }
  parts.push(part);
  totalChars.n += sep + part.length;
  return true;
}

/**
 * Fetches recent PRs from a public repo, feeds raw review text to a model, and
 * only persists Exabase memories for non-noisy, synthesized insights.
 */
export async function ingestPrCommentsToMemories(
  baseId: string,
  repoInput: string,
): Promise<{
  created: number;
  prsConsidered: number;
  requestCount: number;
  rawCommentBlocks: number;
  memoriesSynthesized: number;
}> {
  if (!hasOpenAiKey()) {
    throw new Error(
      "OPENAI_API_KEY is required to analyze PR comments and create memories. Add it to your environment and try again.",
    );
  }
  if (!baseId) {
    throw new Error("Missing base id");
  }
  const parsed = parseOwnerRepoFromInput(repoInput);
  if (!parsed) {
    throw new Error(
      "Use a public GitHub repo URL with owner and name, e.g. https://github.com/vercel/ai",
    );
  }
  const { owner, repo } = parsed;
  const api = getExabase();
  const scope = { baseId };
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  let requestCount = 0;
  const doGet = async <T>(u: string) => {
    requestCount += 1;
    return ghGetJson<T>(u);
  };

  const pullsUrl = new URL("https://api.github.com/search/issues");
  pullsUrl.searchParams.set(
    "q",
    `repo:${owner}/${repo} is:pr is:merged comments:>5`,
  );
  pullsUrl.searchParams.set("sort", "updated");
  pullsUrl.searchParams.set("order", "desc");
  pullsUrl.searchParams.set("per_page", String(MAX_PRS));
  const pullsRes = await doGet<SearchIssuesResponse>(pullsUrl.toString());
  if (!pullsRes.ok) {
    const err = (pullsRes.data as { message?: string })?.message;
    const hint =
      err?.toLowerCase().includes("rate limit") ||
      err?.toLowerCase().includes("api")
        ? " If this persists, add GITHUB_TOKEN in .env for higher rate limits."
        : "";
    throw new Error(
      `GitHub API error for ${owner}/${repo}: ${err ?? "Request failed"}.${hint}`,
    );
  }
  const mergedWithEnoughComments = Array.isArray(pullsRes.data.items)
    ? pullsRes.data.items.slice(0, MAX_PRS)
    : [];

  if (mergedWithEnoughComments.length === 0) {
    return {
      created: 0,
      prsConsidered: 0,
      requestCount,
      rawCommentBlocks: 0,
      memoriesSynthesized: 0,
    };
  }

  const parts: string[] = [];
  const totalChars = { n: 0 };

  collect: for (const pr of mergedWithEnoughComments) {
    if (parts.length >= MAX_RAW_BLOCKS) {
      break;
    }
    if (totalChars.n >= MAX_THREAD_CHARS) {
      break;
    }
    const num = pr.number;
    const issueC = await doGet<GhComment[]>(`${base}/issues/${num}/comments`);
    if (issueC.ok && Array.isArray(issueC.data)) {
      for (const c of issueC.data) {
        const line = lineForIssueComment(num, c);
        if (line) {
          if (!tryPushPart(parts, line, totalChars)) {
            break collect;
          }
        }
        if (parts.length >= MAX_RAW_BLOCKS) {
          break collect;
        }
      }
    }
    if (parts.length >= MAX_RAW_BLOCKS) {
      break;
    }
    if (totalChars.n >= MAX_THREAD_CHARS) {
      break;
    }
    const reviewC = await doGet<(GhComment & { path: string | null })[]>(
      `${base}/pulls/${num}/comments`,
    );
    if (reviewC.ok && Array.isArray(reviewC.data)) {
      for (const c of reviewC.data) {
        const line = lineForReviewComment(num, c.path, c);
        if (line) {
          if (!tryPushPart(parts, line, totalChars)) {
            break collect;
          }
        }
        if (parts.length >= MAX_RAW_BLOCKS) {
          break collect;
        }
      }
    }
  }

  const rawCommentBlocks = parts.length;
  if (rawCommentBlocks === 0) {
    return {
      created: 0,
      prsConsidered: mergedWithEnoughComments.length,
      requestCount,
      rawCommentBlocks: 0,
      memoriesSynthesized: 0,
    };
  }

  const threadText = parts.join("\n\n---\n\n");

  const memoryStrings = await synthesizePrReviewMemories(threadText, {
    owner,
    repo,
    rawCommentBlocks,
  });

  const memoriesSynthesized = memoryStrings.length;
  let created = 0;
  for (const content of memoryStrings) {
    if (created >= MAX_MEMORIES) {
      break;
    }
    const trimmed = content.trim();
    if (trimmed.length < 1) {
      continue;
    }
    await api.memories.create(
      { source: "text", content: trimmed, infer: false },
      scope,
    );
    created += 1;
  }

  return {
    created,
    prsConsidered: mergedWithEnoughComments.length,
    requestCount,
    rawCommentBlocks,
    memoriesSynthesized,
  };
}
