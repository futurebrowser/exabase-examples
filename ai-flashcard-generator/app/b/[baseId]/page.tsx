import { Page } from "./_client-page";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params;
  return <Page baseId={baseId} />;
}
