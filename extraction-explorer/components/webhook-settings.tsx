"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/react";

export function WebhookSettings() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.settings.get.useQuery();
  const current = settingsQuery.data?.data.webhookUrl ?? null;

  const [value, setValue] = useState("");
  const [dirty, setDirty] = useState(false);

  // Mirror the loaded value into the field until the user starts editing.
  useEffect(() => {
    if (!dirty) setValue(current ?? "");
  }, [current, dirty]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      void utils.settings.get.invalidate();
    },
  });

  const err =
    (updateMutation.error instanceof Error && updateMutation.error.message) ||
    (settingsQuery.error instanceof Error && settingsQuery.error.message) ||
    null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook</CardTitle>
        <CardDescription>
          Exabase POSTs extraction events to this URL. Leave empty to disable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://example.com/webhooks/exabase"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setDirty(true);
            }}
            className="font-mono"
            disabled={updateMutation.isPending || settingsQuery.isLoading}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={updateMutation.isPending || !dirty}
            onClick={() =>
              updateMutation.mutate({
                webhookUrl: value.trim() === "" ? null : value.trim(),
              })
            }
          >
            {updateMutation.isPending ? "…" : "Save"}
          </Button>
          {current ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={() => {
                setDirty(false);
                updateMutation.mutate({ webhookUrl: null });
              }}
            >
              Clear
            </Button>
          ) : null}
          <span className="font-mono text-muted-foreground text-xs">
            {current ? "enabled" : "disabled"}
          </span>
        </div>
        {err ? (
          <p className="break-all font-mono text-destructive text-xs">{err}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
