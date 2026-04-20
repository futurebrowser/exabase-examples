const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function mimeForFilename(filename: string): string {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}
