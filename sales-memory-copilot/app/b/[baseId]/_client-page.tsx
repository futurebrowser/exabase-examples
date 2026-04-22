"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/react";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error !== undefined && error !== null) return String(error);
  return "Something went wrong.";
}

export function WorkspaceCopilot({ baseId }: { baseId: string }) {
  const [clientName, setClientName] = useState("Acme");
  const [ask, setAsk] = useState("Prep me for the renewal call.");
  const [notes, setNotes] = useState(
    `Voice call transcript snippets:
Sales rep (Noah): "Thanks everyone. Goal today is to unblock security/legal and align on rollout scope for the 12-month renewal."
Client champion (Maya, Director of Revenue Ops): "Our biggest concern is implementation risk across EMEA. We are replacing two legacy tools and cannot afford downtime in Q3."
CTO (Arun): "Security review is mostly done, but we need explicit data residency guarantees for Germany and France. Also clarify subprocessors and retention windows."
Procurement lead (Lena): "Budget is approved at 240k ARR baseline. We can stretch to 300k only if onboarding services and premium support are included."
Legal counsel (James): "Redlines remain on liability cap, audit rights, and deletion SLA. We need 30-day deletion after termination, not 90."
Customer success manager (Ivy): "Current users rate support highly, but admins reported friction in SSO setup and role mapping."
Sales rep (Noah): "If we phase rollout by region and provide a named solutions architect for first 60 days, would that de-risk go-live?"
Client champion (Maya): "Yes, especially if we start UK + Netherlands in July, then Germany in August after legal sign-off."
CTO (Arun): "Need written commitment on SAML, SCIM, and event export API parity before signing."
Procurement lead (Lena): "Commercials: net 45 payment terms requested, 3-year option with fixed uplift under 5%, and renewal cap language."
Client champion (Maya): "Expansion upside exists: sales coaching and analytics modules for 200 additional seats in Q4 if rollout succeeds."
Sales rep (Noah): "Action items: send revised order form, security addendum, implementation plan, and executive business case by Friday."

Call outcomes and extracted facts:
- Decision status: "Positive but conditional"; no final signature yet.
- Buying committee: Maya (champion), Arun (technical approver), Lena (commercial gate), James (legal gate).
- Primary value drivers: faster onboarding, consolidated tooling, regional scale support.
- Top objections: legal liability cap, deletion SLA, data residency guarantees, API parity confidence.
- Budget envelope: approved 240k ARR; stretch to 300k ARR if premium package value is proven.
- Timeline pressure: go-live for UK + NL in July, Germany in August, full EMEA by end of Q3.
- Expansion potential: +200 seats and analytics add-on in Q4 contingent on successful first rollout.

Client research dossier:
- Company profile: Acme is a B2B SaaS vendor (~1,400 employees) serving mid-market logistics firms.
- Strategic initiative: announced EMEA expansion and platform consolidation in latest earnings call.
- Hiring signals: 12 open Solutions Engineer roles and 8 RevOps roles posted in the last 45 days.
- Competitive context: currently using a patchwork of in-house workflows + two point solutions; both contracts expire this quarter.
- Financial context: CFO emphasized cost discipline; prefers predictable multi-year pricing over variable usage.
- Technical stack clues: heavy Snowflake usage, Okta for identity, Segment for event routing.
- Leadership priorities: CTO publicly prioritizes reliability, auditability, and integration velocity.
- Risk posture: legal team is conservative due to recent vendor incident in another business unit.

Historical relationship context:
- Prior quarter pilot covered 45 users in one region and met KPI targets:
  - onboarding time reduced by 31%
  - rep admin workload reduced by 22%
  - manager adoption reached 78% weekly active usage
- Two unresolved friction points from pilot:
  - SCIM group sync edge cases for contractors
  - delayed webhook retries during peak load windows
- Support history:
  - 14 tickets total in pilot period
  - median first response time: 18 minutes
  - CSAT: 4.6 / 5

Commercial and legal working assumptions:
- Proposed package: platform + onboarding services + premium support.
- Desired terms from client:
  - net 45 payment
  - liability cap increase from 12 months fees to 24 months fees
  - termination assistance language
  - annual uplift cap <= 5% on multi-year option
- Internal fallback positions:
  - can concede net 45 if term is 24+ months
  - can offer 60-day named architect support instead of permanent premium discount
  - can trade liability cap movement for stronger limitation language elsewhere

Internal strategy notes (not shared with client):
- Must avoid over-custom implementation commitments that hurt margin.
- Best wedge for signature this month: executive alignment + phased rollout + clear legal path.
- If legal stalls beyond June 25, consider interim amendment to preserve July launch for UK/NL.
- Expansion narrative should emphasize analytics ROI and manager productivity, not just feature breadth.

Draft next-step checklist:
1) Send redline response pack and revised order form by Friday 3pm.
2) Provide data residency and subprocessors memo signed by security lead.
3) Share implementation plan with phased timeline and named architect.
4) Schedule legal-only working session (James + our counsel) within 3 business days.
5) Book executive sponsor call focused on business case and Q4 expansion path.`,
  );

  const prepareMutation = trpc.copilot.prepare.useMutation();
  const captureMutation = trpc.copilot.capture.useMutation();

  const textareaClass =
    "min-h-24 w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50";

  const brief = prepareMutation.data?.data.brief ?? "";
  const memoriesUsed = prepareMutation.data?.data.memoriesUsed ?? [];
  const latestCapture = captureMutation.data?.data ?? null;

  const lastActionRef = useRef<"prepare" | "capture" | null>(null);

  const shownError =
    lastActionRef.current === "prepare" && prepareMutation.isError
      ? errorMessage(prepareMutation.error)
      : lastActionRef.current === "capture" && captureMutation.isError
        ? errorMessage(captureMutation.error)
        : null;

  function prepareFromMemory() {
    lastActionRef.current = "prepare";
    prepareMutation.mutate({
      baseId,
      clientName,
      ask,
      limit: 8,
    });
  }

  function captureCallMemory() {
    lastActionRef.current = "capture";
    captureMutation.mutate({
      baseId,
      clientName,
      notes,
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <Link href={"/"}>
        <Button className={"w-fit"}>Back to home</Button>
      </Link>
      <Card>
        <CardHeader>
          <Badge variant="outline" className="mb-3">
            Base: {baseId}
          </Badge>
          <CardTitle>Sales Memory Copilot</CardTitle>
          <CardDescription>
            1) Retrieve memory for prep. 2) Capture new call memory. 3) Re-run
            prep to see improvement.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 1 - Capture new memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="notes">Call notes</Label>
            <textarea
              id="notes"
              className={`${textareaClass} min-h-56`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={captureCallMemory}
            disabled={captureMutation.isPending}
          >
            {captureMutation.isPending ? "Saving..." : "Save call memory"}
          </Button>
          <Separator />
          {latestCapture ? (
            <div className="space-y-2">
              <CardDescription>
                Created {latestCapture.totalCreated}{" "}
                {latestCapture.totalCreated === 1 ? "memory" : "memories"}
              </CardDescription>
              {latestCapture.created.map((memory) => (
                <Card key={memory.memoryId} size="sm">
                  <CardHeader>
                    <CardTitle>{memory.memoryTitle}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-xs">
                      {memory.memoryContent}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <CardDescription>
              Latest saved memory will appear here.
            </CardDescription>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Step 2 - Prepare from memory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="client">Client name</Label>
              <Input
                id="client"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ask">Ask</Label>
              <textarea
                id="ask"
                className={textareaClass}
                value={ask}
                onChange={(event) => setAsk(event.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={prepareFromMemory}
              disabled={prepareMutation.isPending}
            >
              {prepareMutation.isPending ? "Preparing..." : "Prepare me"}
            </Button>
            <Separator />
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">
              {brief || "Prep brief will appear here."}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memories used for prep</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memoriesUsed.length > 0 ? (
              memoriesUsed.map((memory) => (
                <Card key={memory.id} size="sm">
                  <CardHeader>
                    <CardTitle>{memory.name || "Untitled memory"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-xs">
                      {memory.content}
                    </pre>
                  </CardContent>
                </Card>
              ))
            ) : (
              <CardDescription>
                No memories loaded yet. Click <strong>Prepare me</strong>.
              </CardDescription>
            )}
          </CardContent>
        </Card>
      </section>

      {shownError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{shownError}</AlertDescription>
        </Alert>
      ) : null}
    </main>
  );
}
