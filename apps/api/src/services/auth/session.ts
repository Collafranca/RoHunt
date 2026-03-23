import { ApiError } from "../../middleware/errors";
import { deleteSessionByToken, getSessionByToken, type Session } from "../../repositories/auth/sessions";
import { getUserById, type AuthUser } from "../../repositories/auth/users";

export const SESSION_COOKIE_NAME = "rohunt_session";
export const OAUTH_STATE_COOKIE_NAME = "rohunt_oauth_state";

function parseCookieValue(cookieHeader: string | undefined, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const segments = cookieHeader.split(";");

  for (const segment of segments) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");

    if (rawName !== cookieName) {
      continue;
    }

    const value = rawValueParts.join("=").trim();

    if (!value) {
      return null;
    }

    return value;
  }

  return null;
}

export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function buildClearedSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function buildClearedOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function parseOAuthStateFromCookie(cookieHeader: string | undefined): string | null {
  return parseCookieValue(cookieHeader, OAUTH_STATE_COOKIE_NAME);
}

export function assertValidOAuthState(queryState: string | undefined, cookieHeader: string | undefined): void {
  const normalizedState = queryState?.trim();
  const cookieState = parseOAuthStateFromCookie(cookieHeader);

  if (!normalizedState || !cookieState || cookieState !== normalizedState) {
    throw new ApiError(400, "INVALID_QUERY", "Invalid 'state' query parameter");
  }
}

export function parseSessionTokenFromCookie(cookieHeader: string | undefined): string | null {
  return parseCookieValue(cookieHeader, SESSION_COOKIE_NAME);
}

export type AuthSessionContext = {
  readonly session: Session;
  readonly user: AuthUser;
};

export function getAuthSessionContextFromCookie(cookieHeader: string | undefined): AuthSessionContext | null {
  const token = parseSessionTokenFromCookie(cookieHeader);

  if (!token) {
    return null;
  }

  const session = getSessionByToken(token);

  if (!session) {
    return null;
  }

  const user = getUserById(session.userId);

  if (!user) {
    deleteSessionByToken(token);
    return null;
  }

  return { session, user };
}

export function requireAuthSessionContext(cookieHeader: string | undefined): AuthSessionContext {
  const context = getAuthSessionContextFromCookie(cookieHeader);

  if (!context) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  return context;
}
