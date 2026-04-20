"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardRow } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

function parseCardText(text: string): { front: string; back: string } | null {
  const simpleLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (simpleLines.length >= 2 && simpleLines[0].endsWith("?")) {
    return { front: simpleLines[0], back: simpleLines[1] };
  }
  if (simpleLines.length === 1) {
    const inline = simpleLines[0].match(/^(.+?\?)\s+(.+)$/);
    if (inline) {
      return { front: inline[1].trim(), back: inline[2].trim() };
    }
  }

  const m = text.match(/^Front:\n([\s\S]*)\n\nBack:\n([\s\S]*)$/);
  if (!m) return null;
  return { front: m[1].trim(), back: m[2].trim() };
}

type FlashcardPreviewItem = {
  id: string;
  front: string;
  back: string;
};

export function FlashcardPreview({
  flashcards,
}: {
  flashcards: FlashcardRow[];
}) {
  const cards = useMemo<FlashcardPreviewItem[]>(
    () =>
      flashcards.map((card) => {
        const parsed = parseCardText(card.text);
        return {
          id: card.id,
          front: parsed?.front ?? card.name ?? card.id,
          back: parsed?.back ?? card.text,
        };
      }),
    [flashcards],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(cards.length - 1, 0)));
    setFlipped(false);
  }, [cards.length]);

  if (cards.length === 0) {
    return <p className="font-mono text-xs text-muted-foreground">None yet.</p>;
  }

  const selectedCard = cards[selectedIndex];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {cards.map((card, index) => {
          const selected = index === selectedIndex;
          return (
            <Button
              key={card.id}
              type="button"
              variant={selected ? "default" : "outline"}
              className={cn(
                "h-10 w-15 rounded-lg p-0 font-mono text-xs",
                selected && "shadow-sm",
              )}
              onClick={() => {
                setSelectedIndex(index);
                setFlipped(false);
              }}
            >
              {index + 1}
            </Button>
          );
        })}
        <Button
          variant="outline"
          className="h-10 rounded-lg p-0 font-mono text-xs px-4"
          onClick={() => {
            setSelectedIndex(Math.floor(Math.random() * cards.length));
            setFlipped(false);
          }}
        >
          Shuffle
        </Button>
      </div>

      <div
        className="flex justify-center my-10 animate-in fade-in duration-500 slide-in-from-top-5 zoom-in-90"
        key={selectedIndex}
      >
        <button
          type="button"
          className="group h-80 max-w-80  w-full cursor-pointer rounded-xl text-left perspective-midrange"
          onClick={() => setFlipped((v) => !v)}
        >
          <span
            className={cn(
              "relative block h-full w-full rounded-4xl transition-transform duration-700 transform-3d shadow-2xl shadow-black/10",
              flipped
                ? "transform-[rotateY(180deg)_rotateX(-8deg)]"
                : "transform-[rotateY(0deg)_rotateX(8deg)]",
            )}
          >
            <span className="absolute inset-0 flex h-full flex-col justify-between rounded-4xl border border-border bg-card p-5 backface-hidden">
              <span className="font-mono uppercase tracking-wide text-muted-foreground">
                Question
              </span>
              <span className="line-clamp-9 text-xl whitespace-pre-wrap wrap-break-word font-medium">
                {selectedCard.front}
              </span>
              <span className="font-mono text-muted-foreground">
                Click to reveal answer
              </span>
            </span>

            <span className="absolute inset-0 flex h-full flex-col justify-between rounded-4xl border border-border bg-card p-5 backface-hidden transform-[rotateY(180deg)]">
              <span className="font-mono uppercase tracking-wide text-muted-foreground">
                Answer
              </span>
              <span className="line-clamp-9 text-lg whitespace-pre-wrap wrap-break-word font-medium">
                {selectedCard.back}
              </span>
              <span className="font-mono text-muted-foreground">
                Click to flip back
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
