"use client";

import { useId, useState } from "react";

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
import { cn } from "@/lib/utils";

export function ExtractInput({
  busy,
  onSubmitUrl,
  onSubmitFile,
}: {
  busy: boolean;
  onSubmitUrl: (url: string) => void;
  onSubmitFile: (file: File) => void;
}) {
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const uploadId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extract</CardTitle>
        <CardDescription>Submit a URL or drop a file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = url.trim();
            if (trimmed) onSubmitUrl(trimmed);
          }}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono"
              disabled={busy}
            />
          </div>
          <Button type="submit" disabled={busy || url.trim().length === 0}>
            {busy ? "…" : "Extract URL"}
          </Button>
        </form>

        <Input
          id={uploadId}
          type="file"
          className="sr-only size-0"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onSubmitFile(file);
          }}
        />
        <Label
          htmlFor={uploadId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onSubmitFile(file);
          }}
          className={cn(
            "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted/30",
            dragOver && "bg-muted/50",
            busy && "pointer-events-none opacity-50",
          )}
        >
          <span className="text-xs text-muted-foreground">
            Drop or choose a file
          </span>
        </Label>
      </CardContent>
    </Card>
  );
}
