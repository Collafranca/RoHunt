export type AuthUserRole = "admin" | "member";

export type AuthUser = {
  readonly id: string;
  readonly discordId: string;
  readonly username: string;
  readonly role: AuthUserRole;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type UpsertDiscordUserInput = {
  readonly discordId: string;
  readonly username: string;
};

const usersById = new Map<string, AuthUser>();
const userIdByDiscordId = new Map<string, string>();
const ADMIN_DISCORD_IDS = new Set<string>(["discord_admin", "discord_admin_stats"]);

function resolveAuthUserRole(discordId: string): AuthUserRole {
  return ADMIN_DISCORD_IDS.has(discordId) ? "admin" : "member";
}

export function upsertDiscordUser(input: UpsertDiscordUserInput): AuthUser {
  const existingUserId = userIdByDiscordId.get(input.discordId);
  const nowIso = new Date().toISOString();
  const role = resolveAuthUserRole(input.discordId);

  if (existingUserId) {
    const existing = usersById.get(existingUserId);

    if (existing) {
      const updated: AuthUser = {
        ...existing,
        username: input.username,
        role,
        updatedAt: nowIso,
      };

      usersById.set(updated.id, updated);
      return updated;
    }
  }

  const id = `user_${input.discordId}`;
  const created: AuthUser = {
    id,
    discordId: input.discordId,
    username: input.username,
    role,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  usersById.set(created.id, created);
  userIdByDiscordId.set(created.discordId, created.id);

  return created;
}

export function getUserById(id: string): AuthUser | null {
  return usersById.get(id) ?? null;
}

export function deleteUserById(id: string): boolean {
  const existing = usersById.get(id);

  if (!existing) {
    return false;
  }

  usersById.delete(id);
  userIdByDiscordId.delete(existing.discordId);

  return true;
}

export function clearUsersRepository(): void {
  usersById.clear();
  userIdByDiscordId.clear();
}
