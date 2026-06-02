import { diffWords } from "diff";

export type WordChange = { value: string; added?: boolean; removed?: boolean };

export function computeWordDiff(a: string, b: string): WordChange[] {
  return diffWords(a, b);
}
