/** Condensed PR-comment–style strings for a demo (no real repo required). */
export const SAMPLE_PR_MEMORIES = [
  "PR #112 — [issue comment] @maya-rivera (2025-10-11): +1 for splitting the feature flag. Let’s add a canary in staging before prod.",
  "PR #112 — [issue comment] @jordan-lee (2025-10-10): Nits: the auth middleware test should also cover 401 for expired token.",
  "PR #112 — [issue comment] @alex-kim (2025-10-12): I’ll merge after the CI on main is green; the flaky test was a separate PR.",
  "PR #118 — [issue comment] @jordan-lee (2025-10-20): Changelog is missing a breaking change note for the prop rename on <Button>.",
  "PR #118 — [issue comment] @maya-rivera (2025-10-20): Suggested: document migration in the README and link to the codemod in the notice.",
  "PR #120 — [review] @maya-rivera on /packages/ui/button.tsx: Avoid shadowing the outer `onClick`—rename to `handleAction` for clarity.",
  "PR #120 — [issue comment] @alex-kim (2025-10-22): We decided to default `variant=ghost` in dark mode; ship it in this release.",
  "PR #120 — [issue comment] @jordan-lee (2025-10-22): Follow-up issue filed for a11y audit on the new popover, not a blocker for merge.",
] as const;
