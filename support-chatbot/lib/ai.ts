export function resolveOpenAiModel(): string {
  const raw = process.env.OPENAI_MODEL?.trim();
  return raw && raw.length > 0 ? raw : "gpt-4o-mini";
}

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
