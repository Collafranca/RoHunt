export type DiscordSourceMessage = {
  readonly messageId: string;
  readonly channelId: string;
  readonly guildId: string;
  readonly authorId: string;
  readonly content: string;
  readonly postedAt: string;
};
