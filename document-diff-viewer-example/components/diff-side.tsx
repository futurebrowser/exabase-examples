"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export type DiffSideValue = { url: string } | { file: File };

export function DiffSide({
  label,
  disabled,
  onChange,
}: {
  label: string;
  disabled: boolean;
  onChange: (value: DiffSideValue | null) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  function switchMode(next: "url" | "file") {
    setMode(next);
    setUrl("");
    setFileName(null);
    onChange(null);
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setUrl(v);
    try {
      new URL(v);
      onChange({ url: v });
    } catch {
      onChange(null);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    onChange({ file });
  }

  const inputClass =
    "w-full border border-border bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50";

  return (
    <div className="space-y-2 border border-border p-3">
      <p className="font-mono text-[10px] uppercase text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-3">
        {(["url", "file"] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => switchMode(m)}
            className={
              mode === m
                ? "font-mono text-xs font-semibold"
                : "font-mono text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      {mode === "url" ? (
        <input
          id={inputId}
          type="url"
          value={url}
          disabled={disabled}
          onChange={handleUrlChange}
          placeholder="https://…"
          className={inputClass}
        />
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={disabled}
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {fileName ?? "Choose file…"}
          </Button>
        </>
      )}
    </div>
  );
}
