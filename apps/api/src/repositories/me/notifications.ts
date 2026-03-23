export type NotificationRule = {
  readonly id: string;
  readonly userId: string;
  readonly channel: string;
  readonly keyword: string;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type CreateNotificationRuleInput = {
  readonly userId: string;
  readonly channel: string;
  readonly keyword: string;
};

type UpdateNotificationRuleInput = {
  readonly keyword?: string;
  readonly enabled?: boolean;
};

const notificationRulesByUserId = new Map<string, Map<string, NotificationRule>>();
let notificationRuleSequence = 0;

function getUserNotificationStore(userId: string): Map<string, NotificationRule> {
  let store = notificationRulesByUserId.get(userId);

  if (!store) {
    store = new Map<string, NotificationRule>();
    notificationRulesByUserId.set(userId, store);
  }

  return store;
}

export function listNotificationRulesByUserId(userId: string): NotificationRule[] {
  const store = notificationRulesByUserId.get(userId);

  if (!store) {
    return [];
  }

  return [...store.values()];
}

export function createNotificationRule(input: CreateNotificationRuleInput): NotificationRule {
  notificationRuleSequence += 1;

  const nowIso = new Date().toISOString();
  const rule: NotificationRule = {
    id: `notification_rule_${notificationRuleSequence}`,
    userId: input.userId,
    channel: input.channel,
    keyword: input.keyword,
    enabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  getUserNotificationStore(input.userId).set(rule.id, rule);

  return rule;
}

export function updateNotificationRuleById(
  userId: string,
  ruleId: string,
  input: UpdateNotificationRuleInput,
): NotificationRule | null {
  const store = notificationRulesByUserId.get(userId);

  if (!store) {
    return null;
  }

  const existing = store.get(ruleId);

  if (!existing) {
    return null;
  }

  const updated: NotificationRule = {
    ...existing,
    keyword: input.keyword ?? existing.keyword,
    enabled: input.enabled ?? existing.enabled,
    updatedAt: new Date().toISOString(),
  };

  store.set(ruleId, updated);

  return updated;
}

export function deleteNotificationRuleById(userId: string, ruleId: string): boolean {
  const store = notificationRulesByUserId.get(userId);

  if (!store) {
    return false;
  }

  const removed = store.delete(ruleId);

  if (store.size === 0) {
    notificationRulesByUserId.delete(userId);
  }

  return removed;
}

export function deleteNotificationRulesByUserId(userId: string): boolean {
  return notificationRulesByUserId.delete(userId);
}

export function clearNotificationRulesRepository(): void {
  notificationRulesByUserId.clear();
  notificationRuleSequence = 0;
}
