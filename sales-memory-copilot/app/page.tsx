"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CreateBaseResponse = { baseId: string };

export default function Home() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBase() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
      });
      const data = (await response.json()) as
        | CreateBaseResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          data && "error" in data ? data.error : "Could not create base",
        );
      }

      const payload = data as CreateBaseResponse;
      window.location.href = `/b/${payload.baseId}`;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create base",
      );
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales Memory Copilot</CardTitle>
          <CardDescription>
            Minimal memory-first demo: prepare a meeting from existing memories,
            add new call notes, then regenerate from updated memory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={createBase}
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            {isCreating ? "Creating..." : "New base"}
          </Button>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
