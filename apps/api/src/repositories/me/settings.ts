export type MeSettings = {
  readonly userId: string;
  readonly jobAlertsEnabled: boolean;
  readonly visibility: "public" | "private";
  readonly updatedAt: string;
};

type UpdateMeSettingsInput = {
  readonly jobAlertsEnabled?: boolean;
  readonly visibility?: "public" | "private";
};

const settingsByUserId = new Map<string, MeSettings>();

function createDefaultSettings(userId: string): MeSettings {
  return {
    userId,
    jobAlertsEnabled: true,
    visibility: "public",
    updatedAt: new Date().toISOString(),
  };
}

export function getSettingsByUserId(userId: string): MeSettings {
  const existing = settingsByUserId.get(userId);

  if (existing) {
    return existing;
  }

  const defaults = createDefaultSettings(userId);
  settingsByUserId.set(userId, defaults);

  return defaults;
}

export function updateSettingsByUserId(userId: string, input: UpdateMeSettingsInput): MeSettings {
  const current = getSettingsByUserId(userId);

  const updated: MeSettings = {
    ...current,
    jobAlertsEnabled: input.jobAlertsEnabled ?? current.jobAlertsEnabled,
    visibility: input.visibility ?? current.visibility,
    updatedAt: new Date().toISOString(),
  };

  settingsByUserId.set(userId, updated);

  return updated;
}

export function deleteSettingsByUserId(userId: string): boolean {
  return settingsByUserId.delete(userId);
}

export function clearSettingsRepository(): void {
  settingsByUserId.clear();
}
