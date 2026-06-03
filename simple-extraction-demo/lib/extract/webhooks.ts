import "server-only";

import {
  type ExtractSettingsDto,
  extractSettingsDtoSchema,
  type WebhookLogDetailDto,
  type WebhookLogsDto,
  webhookLogDetailDtoSchema,
  webhookLogsDtoSchema,
} from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

export async function getSettings(): Promise<ExtractSettingsDto> {
  const settings = await getExabase().extractSettings.get();
  return extractSettingsDtoSchema.parse({ webhookUrl: settings.webhookUrl });
}

export async function updateSettings(
  webhookUrl: string | null,
): Promise<ExtractSettingsDto> {
  const settings = await getExabase().extractSettings.update({ webhookUrl });
  return extractSettingsDtoSchema.parse({ webhookUrl: settings.webhookUrl });
}

export async function listWebhookLogs(jobId: string): Promise<WebhookLogsDto> {
  const res = await getExabase().extract.listWebhookLogs({ jobId });
  return webhookLogsDtoSchema.parse({
    items: res.items.map((log) => ({
      id: log.id,
      traceId: log.traceId,
      attemptNumber: log.attemptNumber,
      status: log.status,
      statusCode: log.statusCode,
      errorMessage: log.errorMessage,
      firedAt: log.firedAt ? log.firedAt.toISOString() : null,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}

export async function getWebhookLog(
  jobId: string,
  logId: string,
): Promise<WebhookLogDetailDto> {
  const log = await getExabase().extract.getWebhookLog({ jobId, logId });
  return webhookLogDetailDtoSchema.parse({
    id: log.id,
    traceId: log.traceId,
    attemptNumber: log.attemptNumber,
    status: log.status,
    statusCode: log.statusCode,
    errorMessage: log.errorMessage,
    firedAt: log.firedAt ? log.firedAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
    requestPayloadJson: log.requestPayload
      ? JSON.stringify(log.requestPayload, null, 2)
      : null,
    responseBody: log.responseBody,
  });
}

export async function triggerWebhook(
  jobId: string,
): Promise<{ traceId: string }> {
  const res = await getExabase().extract.triggerWebhook({ jobId });
  return { traceId: res.traceId };
}
