import {
  createNotificationRule,
  deleteNotificationRuleById,
  listNotificationRulesByUserId,
  updateNotificationRuleById,
} from "../../repositories/me/notifications";

type CreateNotificationRuleInput = {
  readonly userId: string;
  readonly channel: string;
  readonly keyword: string;
};

type UpdateNotificationRuleInput = {
  readonly userId: string;
  readonly ruleId: string;
  readonly keyword?: string;
  readonly enabled?: boolean;
};

export function listNotificationRulesForUser(userId: string) {
  return listNotificationRulesByUserId(userId);
}

export function createNotificationRuleForUser(input: CreateNotificationRuleInput) {
  return createNotificationRule(input);
}

export function updateNotificationRuleForUser(input: UpdateNotificationRuleInput) {
  return updateNotificationRuleById(input.userId, input.ruleId, {
    keyword: input.keyword,
    enabled: input.enabled,
  });
}

export function deleteNotificationRuleForUser(userId: string, ruleId: string): boolean {
  return deleteNotificationRuleById(userId, ruleId);
}
