import { postInternalIngestJobs } from "../../../packages/contracts/src/generated/client";
import { createInternalApiClient } from "./internal-api/client";
import { createIngestIdempotencyKey, toIngestSubmitBody } from "./parsers/ingest";
import type { DiscordSourceMessage } from "./sources/discord";

export type ScraperIngestionFlowDeps = {
  readonly internalApi: Pick<ReturnType<typeof createInternalApiClient>, "send">;
};

export function createScraperIngestionFlow(deps: ScraperIngestionFlowDeps) {
  return {
    async submitDiscordMessage(message: DiscordSourceMessage): Promise<Response> {
      const body = toIngestSubmitBody(message);
      const idempotencyKey = createIngestIdempotencyKey(message);

      return deps.internalApi.send({
        request: postInternalIngestJobs(),
        body,
        idempotencyKey,
      });
    },
  };
}
