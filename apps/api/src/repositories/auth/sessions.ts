export type Session = {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly createdAt: string;
};

type CreateSessionInput = {
  readonly userId: string;
};

const sessionsByToken = new Map<string, Session>();
let sessionSequence = 0;

export function createSession(input: CreateSessionInput): Session {
  sessionSequence += 1;

  const createdAt = new Date().toISOString();
  const id = `session_${sessionSequence}`;
  const token = `${id}_${input.userId}`;

  const session: Session = {
    id,
    userId: input.userId,
    token,
    createdAt,
  };

  sessionsByToken.set(token, session);

  return session;
}

export function getSessionByToken(token: string): Session | null {
  return sessionsByToken.get(token) ?? null;
}

export function deleteSessionByToken(token: string): boolean {
  return sessionsByToken.delete(token);
}

export function clearSessionsRepository(): void {
  sessionsByToken.clear();
  sessionSequence = 0;
}
