import { headers } from "next/headers";
import { WorkspaceApp } from "./workspace-app";

async function appOriginFromRequest(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params;
  const appOrigin = await appOriginFromRequest();
  return <WorkspaceApp baseId={baseId} appOrigin={appOrigin} />;
}
