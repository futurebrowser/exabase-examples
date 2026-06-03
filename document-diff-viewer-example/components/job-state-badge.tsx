import { Badge } from "@/components/ui/badge";
import type { ExtractState } from "@/lib/api/schemas";

export function isTerminal(state: ExtractState): boolean {
  return state === "completed" || state === "failed" || state === "cleaned";
}

function variant(state: ExtractState): "secondary" | "destructive" | "outline" {
  if (state === "failed") return "destructive";
  if (state === "completed") return "secondary";
  return "outline";
}

export function JobStateBadge({ state }: { state: ExtractState }) {
  const label = state ?? "unknown";
  return (
    <Badge variant={variant(state)} className="shrink-0 text-[10px] uppercase">
      {label}
    </Badge>
  );
}
