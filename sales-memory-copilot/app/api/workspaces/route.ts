import { NextResponse } from "next/server";
import { createBaseResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

export async function POST() {
  const api = getExabase();
  const base = await api.bases.create({
    title: "Sales memory demo",
  });

  const body = createBaseResponseSchema.parse({
    baseId: base.id,
  });

  return NextResponse.json(body);
}
