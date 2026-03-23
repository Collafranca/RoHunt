export type AdminUser = {
  readonly id: string;
  readonly discordId: string;
  readonly username: string;
  readonly role: "admin" | "member";
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdminUserAction = "suspend";

export type AdminUserActionResult = {
  readonly userId: string;
  readonly action: AdminUserAction;
  readonly status: "accepted";
  readonly actedAt: string;
};

const actionResultsByUserId = new Map<string, AdminUserActionResult>();

export function listAdminUsers(): AdminUser[] {
  const nowIso = new Date().toISOString();

  return [
    {
      id: "user_admin",
      discordId: "discord_admin",
      username: "user_admin",
      role: "admin",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "user_member",
      discordId: "discord_member",
      username: "user_member",
      role: "member",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

export function getAdminUserById(userId: string): AdminUser | null {
  const user = listAdminUsers().find((entry) => entry.id === userId);

  return user ?? null;
}

export function applyAdminUserAction(userId: string, action: AdminUserAction): AdminUserActionResult {
  const result: AdminUserActionResult = {
    userId,
    action,
    status: "accepted",
    actedAt: new Date().toISOString(),
  };

  actionResultsByUserId.set(userId, result);

  return result;
}

export function clearAdminUsersRepository(): void {
  actionResultsByUserId.clear();
}
