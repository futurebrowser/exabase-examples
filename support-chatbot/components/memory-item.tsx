import type { MemoryListItem } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export type MemoryItemProps = {
  memory: MemoryListItem;
  className?: string;
};

export function MemoryItem({ memory, className }: MemoryItemProps) {
  const heading = memory.name?.trim() || "Memory";
  const when = formatWhen(memory.createdAt);

  return (
    <article
      className={cn(
        "rounded-none border border-border bg-card px-3 py-2.5 text-left text-xs shadow-none",
        className,
      )}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-border pb-1.5">
        <h3 className="font-heading font-medium text-sm text-foreground">
          {heading}
        </h3>
        {when ? (
          <time
            className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
            dateTime={memory.createdAt ?? undefined}
          >
            {when}
          </time>
        ) : null}
      </header>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-muted-foreground text-[13px] leading-snug">
        {memory.content}
      </pre>
    </article>
  );
}
