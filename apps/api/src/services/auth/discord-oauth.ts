import { ApiError } from "../../middleware/errors";

export type DiscordUserProfile = {
  readonly discordId: string;
  readonly username: string;
};

export function exchangeDiscordCode(code: string | undefined): DiscordUserProfile {
  const normalizedCode = code?.trim();

  if (!normalizedCode) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'code' query parameter");
  }

  return {
    discordId: `discord_${normalizedCode}`,
    username: `user_${normalizedCode}`,
  };
}
