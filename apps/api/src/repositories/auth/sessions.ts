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

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSession(input: CreateSessionInput): Session {
  sessionSequence += 1;

  const createdAt = new Date().toISOString();
  const id = `session_${sessionSequence}`;
  const token = generateSessionToken();

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
