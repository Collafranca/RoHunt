export type BackgroundCheckRequest = {
  readonly id: string;
  readonly userId: string;
  readonly targetUserId: string;
  readonly note: string;
  readonly status: "submitted";
  readonly createdAt: string;
};

type CreateBackgroundCheckInput = {
  readonly userId: string;
  readonly targetUserId: string;
  readonly note: string;
};

const backgroundChecksByUserId = new Map<string, BackgroundCheckRequest[]>();
let backgroundCheckSequence = 0;

export function listBackgroundChecksByUserId(userId: string): BackgroundCheckRequest[] {
  return [...(backgroundChecksByUserId.get(userId) ?? [])];
}

export function createBackgroundCheck(input: CreateBackgroundCheckInput): BackgroundCheckRequest {
  backgroundCheckSequence += 1;

  const check: BackgroundCheckRequest = {
    id: `background_check_${backgroundCheckSequence}`,
    userId: input.userId,
    targetUserId: input.targetUserId,
    note: input.note,
    status: "submitted",
    createdAt: new Date().toISOString(),
  };

  const existing = backgroundChecksByUserId.get(input.userId) ?? [];
  existing.push(check);
  backgroundChecksByUserId.set(input.userId, existing);

  return check;
}
