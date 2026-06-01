"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/react";

export function ExtractChunks({
  jobId,
  chunkCount,
}: {
  jobId: string;
  chunkCount: number;
}) {
  // `start` is the next sequence to request; the query fetches one window from it.
  const [start, setStart] = useState(1);
  const chunksQuery = trpc.extract.chunks.useQuery(
    { jobId, start },
    { enabled: chunkCount > 0 },
  );

  const [items, setItems] = useState<
    { sequence: number; text: string; pageNumber: number | null }[]
  >([]);

  // Accumulate as windows arrive.
  const fetched = chunksQuery.data?.data.items ?? [];
  const merged = mergeBySequence(items, fetched);

  if (chunkCount === 0) return null;

  const hasMore = merged.length < chunkCount;

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-muted-foreground">
        {merged.length}/{chunkCount} chunks
      </p>
      <ul className="divide-y divide-border border border-border">
        {merged.map((c) => (
          <li key={c.sequence} className="space-y-1 px-3 py-2">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              #{c.sequence}
              {c.pageNumber != null ? ` · p${c.pageNumber}` : ""}
            </span>
            <p className="whitespace-pre-wrap text-xs">{c.text}</p>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={chunksQuery.isFetching}
          onClick={() => {
            setItems(merged);
            setStart(merged.length + 1);
          }}
        >
          {chunksQuery.isFetching ? "…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}

function mergeBySequence<T extends { sequence: number }>(a: T[], b: T[]): T[] {
  const map = new Map<number, T>();
  for (const x of a) map.set(x.sequence, x);
  for (const x of b) map.set(x.sequence, x);
  return [...map.values()].sort((x, y) => x.sequence - y.sequence);
}
