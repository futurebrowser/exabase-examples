import "server-only";

import {
	deleteAllFlashcardsResponseSchema,
	flashcardsResponseSchema,
} from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

const FLASHCARD_LIST_LIMIT = 256;
const FLASHCARD_MARKER_RE = /\\?\[flashcard\\?\]/i;
const FLASHCARD_NAME_PREFIX_RE = /^flashcard:\s*/i;

function normalizeMemoryText(raw: string): string {
	return raw.replaceAll("\\[", "[").replaceAll("\\]", "]");
}

function asFlashcardText(content: string): string {
	const normalized = normalizeMemoryText(content).trim();
	const withoutMarker = normalized.replace(/^\[flashcard\]\s*/i, "").trim();
	const qa = splitQuestionAnswer(withoutMarker);
	if (qa) {
		return `${qa.question}\n${qa.answer}`;
	}
	const inline = withoutMarker.match(
		/^Front:\s*([\s\S]*?)\n\nBack:\s*([\s\S]*)$/,
	);
	if (inline) {
		const front = inline[1].trim();
		const back = inline[2].trim();
		if (front && back) {
			return `Front:\n${front}\n\nBack:\n${back}`;
		}
	}
	return withoutMarker;
}

function splitQuestionAnswer(
	text: string,
): { question: string; answer: string } | null {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length === 2 && lines[0].endsWith("?") && lines[1].length > 0) {
		return { question: lines[0], answer: lines[1] };
	}

	if (lines.length === 1) {
		const inline = lines[0].match(/^(.+?\?)\s+(.+)$/);
		if (inline) {
			const question = inline[1].trim();
			const answer = inline[2].trim();
			if (question.endsWith("?") && answer.length > 0) {
				return { question, answer };
			}
		}
	}

	return null;
}

function hasQuestionAnswerPair(text: string): boolean {
	return splitQuestionAnswer(text) !== null;
}

async function getFlashcardMemoryHits(baseId: string) {
	const api = getExabase();
	const res = await api.memories.search(
		{
			limit: FLASHCARD_LIST_LIMIT,
			order: { property: "createdAt", direction: "DESC" },
		} as Parameters<typeof api.memories.search>[0],
		{ baseId },
	);

	return res.hits.filter((hit) => {
		const content = normalizeMemoryText(hit.content ?? "");
		const name = normalizeMemoryText(hit.name ?? "");
		const nameLooksLikeFlashcard = FLASHCARD_NAME_PREFIX_RE.test(name);
		const legacyMarker =
			FLASHCARD_MARKER_RE.test(content) || FLASHCARD_MARKER_RE.test(name);
		return (
			legacyMarker || nameLooksLikeFlashcard || hasQuestionAnswerPair(content)
		);
	});
}

export async function listFlashcardsForBase(baseId: string) {
	const hits = await getFlashcardMemoryHits(baseId);
	const flashcards = hits
		.map((hit) => {
			return {
				id: hit.id,
				name: hit.name,
				text: asFlashcardText(hit.content),
			};
		})
		.filter((row) => row.text.length > 0);

	return flashcardsResponseSchema.parse({ flashcards });
}

export async function deleteAllFlashcardsForBase(baseId: string) {
	const api = getExabase();
	const hits = await getFlashcardMemoryHits(baseId);
	const ids = hits.map((hit) => hit.id);

	for (const id of ids) {
		await api.memories.delete({ memoryId: id }, { baseId });
	}

	return deleteAllFlashcardsResponseSchema.parse({
		deleted: ids.length,
	});
}
