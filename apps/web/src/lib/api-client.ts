import {
  getAdminStats,
  getAdminUsers,
  getMeAuthMe,
  getMeBackgroundCheck,
  getMeNotifications,
  getMePortfolioReviews,
  getMeSavedJobs,
  getMeSettings,
  getPublicJobs,
  getPublicReferences,
  getPublicScams,
  getPublicStatus,
} from "../../../../packages/contracts/src/generated/client";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type SurfaceItems = unknown[];

type ApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: FetchLike;
  cookieHeader?: string;
};

export type SurfaceState<T> =
  | { kind: "loading"; message: string; items: []; payload: null }
  | { kind: "error"; message: string; items: []; payload: null }
  | { kind: "empty"; message: string; items: []; payload: T }
  | { kind: "data"; message: string; items: SurfaceItems; payload: T };

export type AuthSessionState = {
  authenticated: boolean;
  isAdmin: boolean;
};

const AUTH_FORWARD_COOKIE_NAMES = new Set<string>(["rohunt_session", "rh_session"]);

function buildUrl(baseUrl: string, path: string): string {
  return new URL(path, `${baseUrl}/`).toString();
}

function resolveBaseUrl(override?: string): string | null {
  if (typeof override === "string" && override.trim().length > 0) {
    return override;
  }

  const envBaseUrl = process.env.ROHUNT_API_BASE_URL ?? process.env.PUBLIC_ROHUNT_API_BASE_URL;

  if (typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0) {
    return envBaseUrl;
  }

  return null;
}

function classifyItems(payload: unknown): SurfaceItems {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload !== null && typeof payload === "object") {
    return [payload];
  }

  return [];
}

function buildAuthCookieHeader(cookieHeader: string | undefined): string | undefined {
  if (typeof cookieHeader !== "string" || cookieHeader.trim().length === 0) {
    return undefined;
  }

  const allowedSegments: string[] = [];

  for (const segment of cookieHeader.split(";")) {
    const trimmedSegment = segment.trim();

    if (!trimmedSegment) {
      continue;
    }

    const separatorIndex = trimmedSegment.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmedSegment.slice(0, separatorIndex).trim();
    const value = trimmedSegment.slice(separatorIndex + 1).trim();

    if (!AUTH_FORWARD_COOKIE_NAMES.has(name) || value.length === 0) {
      continue;
    }

    allowedSegments.push(`${name}=${value}`);
  }

  if (allowedSegments.length === 0) {
    return undefined;
  }

  return allowedSegments.join("; ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function readUserFromAuthPayload(payload: unknown): { isAdmin: boolean } | null {
  if (!isRecord(payload)) {
    return null;
  }

  const data = payload.data;

  if (!isRecord(data)) {
    return null;
  }

  const user = data.user;

  if (!isRecord(user)) {
    return null;
  }

  const id = user.id;

  if (typeof id !== "string" || id.trim().length === 0) {
    return null;
  }

  return {
    isAdmin: user.role === "admin",
  };
}

function buildRequestInit(request: { method: string }, options: ApiClientOptions | undefined, includeSessionCookies: boolean): RequestInit {
  const init: RequestInit = {
    method: request.method,
  };

  if (includeSessionCookies) {
    init.credentials = "include";
    const authCookieHeader = buildAuthCookieHeader(options?.cookieHeader);

    if (authCookieHeader) {
      init.headers = {
        cookie: authCookieHeader,
      };
    }
  }

  return init;
}

async function loadData<T>(
  request: { method: string; path: string },
  options?: ApiClientOptions,
  includeSessionCookies = false,
): Promise<SurfaceState<T>> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);

  if (!baseUrl) {
    return { kind: "error", message: "API base URL is not configured.", items: [], payload: null };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(buildUrl(baseUrl, request.path), buildRequestInit(request, options, includeSessionCookies));

    if (!response.ok) {
      return { kind: "error", message: `Request failed (${response.status})`, items: [], payload: null };
    }

    const payload = (await response.json()) as T;
    const items = classifyItems(payload);

    if (items.length === 0) {
      return { kind: "empty", message: "No records available.", items: [], payload };
    }

    return { kind: "data", message: `Loaded ${items.length} records.`, items, payload };
  } catch {
    return { kind: "error", message: "Failed to load data.", items: [], payload: null };
  }
}

export async function getAuthSessionState(options?: ApiClientOptions): Promise<AuthSessionState> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);

  if (!baseUrl) {
    return { authenticated: false, isAdmin: false };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const request = getMeAuthMe();

  try {
    const response = await fetchImpl(buildUrl(baseUrl, request.path), buildRequestInit(request, options, true));

    if (response.status === 401) {
      return { authenticated: false, isAdmin: false };
    }

    if (!response.ok) {
      return { authenticated: false, isAdmin: false };
    }

    const authUser = readUserFromAuthPayload(await response.json());

    if (!authUser) {
      return { authenticated: false, isAdmin: false };
    }

    return {
      authenticated: true,
      isAdmin: authUser.isAdmin,
    };
  } catch {
    return { authenticated: false, isAdmin: false };
  }
}

export function getLoadingState<T>(message: string): SurfaceState<T> {
  return { kind: "loading", message, items: [], payload: null };
}

export function getHomePageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getPublicStatus(), options);
}

export function getJobsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getPublicJobs(), options);
}

export function getScamsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getPublicScams(), options);
}

export function getAnalyticsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getPublicReferences(), options);
}

export function getSavedJobsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getMeSavedJobs(), options, true);
}

export function getNotificationsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getMeNotifications(), options, true);
}

export function getBackgroundCheckPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getMeBackgroundCheck(), options, true);
}

export function getPortfolioReviewPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getMePortfolioReviews(), options, true);
}

export function getSettingsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getMeSettings(), options, true);
}

export function getAdminUsersPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getAdminUsers(), options, true);
}

export function getAdminStatsPageData(options?: ApiClientOptions) {
  return loadData<unknown[]>(getAdminStats(), options, true);
}
