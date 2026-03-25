import { createHash } from "node:crypto";

import type { DiscordSourceMessage } from "../sources/discord";

export type IngestNormalizedPayload = {
  readonly source: "discord";
  readonly sourceMessageId: string;
  readonly sourceChannelId: string;
  readonly sourceGuildId: string;
  readonly authorId: string;
  readonly content: string;
  readonly postedAt: string;
};

export type IngestSubmitBody = {
  readonly source: "discord";
  readonly sourceMessageId: string;
  readonly normalizedPayload: IngestNormalizedPayload;
};

export function normalizeDiscordMessage(message: DiscordSourceMessage): IngestNormalizedPayload {
  return {
    source: "discord",
    sourceMessageId: message.messageId,
    sourceChannelId: message.channelId,
    sourceGuildId: message.guildId,
    authorId: message.authorId,
    content: message.content.trim(),
    postedAt: message.postedAt,
  };
}

export function toIngestSubmitBody(message: DiscordSourceMessage): IngestSubmitBody {
  return {
    source: "discord",
    sourceMessageId: message.messageId,
    normalizedPayload: normalizeDiscordMessage(message),
  };
}

export function createIngestIdempotencyKey(message: DiscordSourceMessage): string {
  const digest = createHash("sha256")
    .update(`discord:${message.guildId}:${message.channelId}:${message.messageId}`)
    .digest("hex");

  return `ingest:discord:${digest}`;
}
