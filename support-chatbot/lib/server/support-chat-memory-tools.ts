import type { ToolSet } from "ai";
import { tool } from "ai";
import "server-only";
import { z } from "zod";

import { getExabase } from "@/lib/exabase-server";

export function buildSupportMemoryTools(baseId: string): ToolSet {
	const scope = { baseId };

	return {
		searchMemory: tool({
			description:
				'Search saved memories for this workspace (people, family, work, goals, plans, preferences). Hybrid semantic + keyword search—use before answering when recall might matter. Phrase the query as a full question (e.g. "What do I know about their work schedule?"), not a flat keyword list.',
			inputSchema: z.object({
				query: z
					.string()
					.min(1)
					.describe(
						"A natural-language question the search should answer, not bare keywords (e.g. What are their dog's routines?)",
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
				"Save a verbatim memory for this workspace. Use when the user asks you to remember something or when retaining a durable detail for future sessions—no rewriting or inference.",
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
