import { WorkspaceCopilot } from "@/components/workspace-copilot";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params;
  return <WorkspaceCopilot baseId={baseId} />;
}
