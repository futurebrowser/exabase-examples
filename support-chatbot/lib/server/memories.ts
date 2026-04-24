import "server-only";

import type { MemoryListItem } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

/**
 * Lists memories for a base via hybrid search API (no dedicated list endpoint).
 * Omitting `query` returns recent matches for the base scope.
 */
export async function listMemoriesForBase(
	baseId: string,
): Promise<MemoryListItem[]> {
	const api = getExabase();
	const res = await api.memories.search(
		{
			limit: 200,
			order: { property: "createdAt", direction: "DESC" },
		},
		{ baseId },
	);

	return res.hits.map((hit) => ({
		id: hit.id,
		name: hit.name,
		content: hit.content,
		createdAt: hit.createdAt ?? null,
	}));
}

export async function deleteMemoryForBase(baseId: string, memoryId: string) {
	const api = getExabase();
	await api.memories.delete({ memoryId }, { baseId });
}
