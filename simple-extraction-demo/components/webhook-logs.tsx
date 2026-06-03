"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  WebhookLogStatusDto,
  WebhookLogSummaryDto,
} from "@/lib/api/schemas";
import { trpc } from "@/lib/trpc/react";

function statusVariant(
  status: WebhookLogStatusDto,
): "secondary" | "destructive" | "outline" {
  if (status === "success") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}

function hasInflight(items: { status: WebhookLogStatusDto }[]): boolean {
  return items.some((l) => l.status === "pending" || l.status === "retrying");
}

export function WebhookLogs({ jobId }: { jobId: string }) {
  const utils = trpc.useUtils();
  const logsQuery = trpc.extract.webhookLogs.useQuery(
    { jobId },
    {
      refetchInterval: (query) =>
        hasInflight(query.state.data?.data.items ?? []) ? 4000 : false,
    },
  );
  const triggerMutation = trpc.extract.triggerWebhook.useMutation({
    onSuccess: () => void utils.extract.webhookLogs.invalidate({ jobId }),
  });

  const items = logsQuery.data?.data.items ?? [];
  const err =
    (logsQuery.error instanceof Error && logsQuery.error.message) ||
    (triggerMutation.error instanceof Error && triggerMutation.error.message) ||
    null;

  return (
    <div className="space-y-2 border border-border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground uppercase">
          Webhook deliveries
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void utils.extract.webhookLogs.invalidate({ jobId })}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={triggerMutation.isPending}
            onClick={() => triggerMutation.mutate({ jobId })}
          >
            {triggerMutation.isPending ? "…" : "Trigger"}
          </Button>
        </div>
      </div>

      {err ? (
        <p className="break-all font-mono text-destructive text-xs">{err}</p>
      ) : null}

      {items.length === 0 ? (
        <p className="font-mono text-muted-foreground text-xs">
          No deliveries yet.
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {items.map((log) => (
            <li key={log.id}>
              <WebhookLogRow jobId={jobId} log={log} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WebhookLogRow({
  jobId,
  log,
}: {
  jobId: string;
  log: WebhookLogSummaryDto;
}) {
  const [open, setOpen] = useState(false);
  const detailQuery = trpc.extract.webhookLog.useQuery(
    { jobId, logId: log.id },
    { enabled: open },
  );
  const detail = detailQuery.data?.data ?? null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/30">
        <span className="font-mono text-xs">
          #{log.attemptNumber}
          {log.statusCode != null ? ` · ${log.statusCode}` : ""}
          {log.firedAt ? ` · ${log.firedAt}` : ""}
        </span>
        <Badge
          variant={statusVariant(log.status)}
          className="text-[10px] uppercase"
        >
          {log.status}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-3 py-2">
        {log.errorMessage ? (
          <p className="break-all font-mono text-destructive text-xs">
            {log.errorMessage}
          </p>
        ) : null}
        {detailQuery.isLoading ? (
          <p className="font-mono text-muted-foreground text-xs">Loading…</p>
        ) : null}
        {detail?.requestPayloadJson ? (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              request
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
              {detail.requestPayloadJson}
            </pre>
          </div>
        ) : null}
        {detail?.responseBody ? (
          <div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              response
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs">
              {detail.responseBody}
            </pre>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
