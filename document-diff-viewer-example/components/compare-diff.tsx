"use client";

import type { WordChange } from "@/lib/diff";

export function CompareDiff({ changes }: { changes: WordChange[] }) {
  if (changes.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        No text content to compare.
      </p>
    );
  }

  return (
    <p className="break-words whitespace-pre-wrap font-mono text-xs leading-relaxed">
      {changes.map((change, i) => {
        if (change.added) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: diff spans are positionally stable
            <span key={i} className="bg-green-100 text-green-800">
              {change.value}
            </span>
          );
        }
        if (change.removed) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: diff spans are positionally stable
            <span key={i} className="bg-red-100 text-red-800 line-through">
              {change.value}
            </span>
          );
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: diff spans are positionally stable
        return <span key={i}>{change.value}</span>;
      })}
    </p>
  );
}
