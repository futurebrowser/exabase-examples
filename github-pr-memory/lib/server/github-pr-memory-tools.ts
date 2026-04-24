import type { ToolSet } from "ai";
import { tool } from "ai";
import "server-only";
import { z } from "zod";

import { getExabase } from "@/lib/exabase-server";

export function buildGithubPrMemoryTools(baseId: string): ToolSet {
	const scope = { baseId };

	return {
		searchMemory: tool({
			description:
				'Search saved PR/review-style memories in this workspace (thread comments, review nits, merge decisions, follow-ups). Hybrid search—use before answering when prior discussion might matter. Phrase the query as a full question (e.g. "What did reviewers say about the auth tests?"), not a keyword list.',
			inputSchema: z.object({
				query: z
					.string()
					.min(1)
					.describe(
						"A natural-language question the search should answer, not bare keywords (e.g. What was the plan for the feature flag in PR 112?)",
					),
				limit: z
					.number()
					.min(1)
					.max(20)
					.optional()
					.describe("Max memories to return (default 8)"),
			}),
			execute: async ({ query, limit }) => {
				if (!baseId) {
					return { ok: false as const, error: "Missing workspace base id." };
				}

				try {
					const api = getExabase();
					const resolvedLimit = limit ?? 8;
					const res = await api.memories.search(
						{
							query,
							limit: resolvedLimit,
						},
						scope,
					);

					return {
						ok: true as const,
						total: res.total,
						hits: res.hits
							.map((h) => ({
								id: h.id,
								name: h.name,
								content: h.content,
								score: h.score ?? null,
								createdAt: h.createdAt,
							}))
							.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
					};
				} catch (e) {
					const message =
						e instanceof Error ? e.message : "Memory search failed.";
					return { ok: false as const, error: message };
				}
			},
		}),

		addMemory: tool({
			description:
				"Save a verbatim memory for this workspace. Use for follow-up tasks, team agreements, or durable review notes the user (or you) may need later—no heavy rewriting.",
			inputSchema: z.object({
				content: z
					.string()
					.min(1)
					.describe("Full text to store as the memory body"),
			}),
			execute: async ({ content }) => {
				if (!baseId) {
					return { ok: false as const, error: "Missing workspace base id." };
				}

				try {
					const api = getExabase();
					await api.memories.create(
						{
							source: "text",
							content: content.trim(),
							infer: false,
						},
						scope,
					);
					return {
						ok: true as const,
					};
				} catch (e) {
					const message =
						e instanceof Error ? e.message : "Failed to create memory.";
					return { ok: false as const, error: message };
				}
			},
		}),
	};
}
