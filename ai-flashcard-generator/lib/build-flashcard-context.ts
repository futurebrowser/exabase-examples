import type { Search200ResponseHitsInner } from "@exabase/sdk";
import { SearchRequestAllOfFiltersKindsEnum } from "@exabase/sdk";
import { getExabase } from "./exabase-server";
import { ensureWorkspaceLayout } from "./workspace-layout";

const MEMORY_LIMIT = 14;
const SEARCH_PAGE_SIZE = 24;
const DOC_PREVIEW_MAX_CHARS = 1500;

export type FlashcardLlmContext = {
  contextText: string;
  thin: boolean;
};

function stripHtml(html: string | null | undefined, maxLen: number): string {
  if (!html) return "";
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen)}…`;
}

function formatSearchHit(hit: Search200ResponseHitsInner): string {
  const title = hit.name?.trim() || "(untitled)";
  const lines: string[] = [`[${hit.kind}] ${title}`];
  if (hit.description?.trim()) lines.push(hit.description.trim());

  switch (hit.kind) {
    case "document": {
      const cap = hit.data?.caption?.trim();
      if (cap) lines.push(`Summary: ${cap}`);
      const kw = hit.data?.keywords?.filter(Boolean).slice(0, 12);
      if (kw?.length) lines.push(`Keywords: ${kw.join(", ")}`);
      const excerpt = stripHtml(
        hit.data?.documentPreview?.html,
        DOC_PREVIEW_MAX_CHARS,
      );
      if (excerpt) lines.push(`Excerpt:\n${excerpt}`);
      break;
    }
    case "bookmark":
      if (hit.url) lines.push(`URL: ${hit.url}`);
      break;
    default:
      break;
  }

  return lines.join("\n");
}

/**
 * Text context for flashcard generation: hybrid search over the library space
 * plus memory snippets. Used with OpenAI (no Exabase chatbot resource binding).
 */
export async function buildFlashcardLlmContext(
  baseId: string,
  topic: string,
): Promise<FlashcardLlmContext> {
  const api = getExabase();
  const { spaceId } = await ensureWorkspaceLayout(baseId);

  const q = topic.trim() || "key concepts definitions summary";

  const scope = { baseId };
  const [searchRes, memRes] = await Promise.all([
    api.search.search(
      {
        text: q,
        filters: {
          parentIds: [spaceId],
          kinds: [
            SearchRequestAllOfFiltersKindsEnum.Document,
            SearchRequestAllOfFiltersKindsEnum.Highlight,
            SearchRequestAllOfFiltersKindsEnum.Bookmark,
          ],
        },
        pagination: { page: 1, pageSize: SEARCH_PAGE_SIZE },
        incognito: true,
      } as Parameters<typeof api.search.search>[0],
      scope,
    ),
    api.memories.search(
      {
        query: q,
        limit: MEMORY_LIMIT,
      } as Parameters<typeof api.memories.search>[0],
      scope,
    ),
  ]);

  const resourceBlocks = searchRes.hits.map(formatSearchHit).filter(Boolean);
  const memoryBlocks = memRes.hits
    .map((h) => {
      const title = h.name ?? "Memory";
      const content = h.content ?? "";
      return `${title}:\n${content}`.trim();
    })
    .filter(Boolean);

  const thin = resourceBlocks.length === 0 && memoryBlocks.length === 0;

  const parts: string[] = [];
  if (resourceBlocks.length > 0) {
    parts.push(
      `## Relevant base resources (search)\n\n${resourceBlocks.join("\n\n---\n\n")}`,
    );
  }
  if (memoryBlocks.length > 0) {
    parts.push(`## Base memories\n\n${memoryBlocks.join("\n\n---\n\n")}`);
  }
  if (thin) {
    parts.push(
      "(No indexed content matched this query yet. The user may need to upload documents or wait for processing.)",
    );
  }

  return {
    contextText: parts.join("\n\n"),
    thin,
  };
}
