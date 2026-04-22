import "server-only";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { hasOpenAiKey, resolveOpenAiModel } from "@/lib/ai";

const prSynthesisSchema = z.object({
  memories: z
    .array(
      z
        .string()
        .min(1)
        .max(3_500)
        .describe(
          "A single, self-contained memory: durable insight a developer should recall later (team convention, something to avoid, structural preference, test/CI pattern, etc.)",
        ),
    )
    .min(0)
    .max(50)
    .describe(
      "Only high-value distilled memories. Omit noisy or duplicative content.",
    ),
});

const MAX_MODEL_MEMORIES = 50;

const SYNTHESIS_SYSTEM = `You turn raw GitHub pull request discussion (issue-thread comments and file-level review comments) into a small set of high-signal, durable memories for a team knowledge base.

Only emit memories that capture:
- Recurring review themes or team preferences (e.g. API shape, error handling, naming, patterns).
- Explicit guidance on code structure, layering, or what belongs where.
- Things reviewers asked to avoid, deprecate, or not merge without (tests, types, a11y, performance, security).
- Shared conventions, tooling, or CI / release expectations that appear in thread.
- Cross-cutting decisions that will matter on future PRs, not a single one-off line comment.

Do NOT create memories for:
- Pure sign-offs, thanks, "LGTM", "merged", or scheduling chatter.
- Duplicates; merge similar points into one clear memory.
- Trivial nits (typos) unless they encode a standing rule.
- Guessing: only ground claims in the provided text.

Write each memory as plain sentences the assistant can search later, prefixed lightly with context if helpful (e.g. "Review convention:" or "Avoid In this codebase:") when the thread implies a rule. No markdown headings required. English only.`;

type SynthesisMeta = { owner: string; repo: string; rawCommentBlocks: number };

export async function synthesizePrReviewMemories(
  threadText: string,
  meta: SynthesisMeta,
): Promise<string[]> {
  if (!hasOpenAiKey()) {
    throw new Error(
      "OPENAI_API_KEY is required to turn PR comments into memories.",
    );
  }
  if (!threadText.trim()) {
    return [];
  }

  const { object } = await generateObject({
    model: openai(resolveOpenAiModel()),
    schema: prSynthesisSchema,
    temperature: 0.25,
    system: SYNTHESIS_SYSTEM,
    prompt: `Repository: ${meta.owner}/${meta.repo}
Raw comment units fed to you: ${meta.rawCommentBlocks} (issues + file reviews, possibly truncated for length)

--- BEGIN THREADS ---
${threadText}
--- END THREADS ---

Output up to ${MAX_MODEL_MEMORIES} memories as specified. If the thread is mostly noise, return an empty list or a very small list of genuinely durable points.`,
  });

  const cleaned = object.memories
    .map((m) => m.replace(/\r\n/g, "\n").trim())
    .filter((m) => m.length > 0);
  return cleaned.slice(0, MAX_MODEL_MEMORIES);
}
