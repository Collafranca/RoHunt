import {
  getAdminStats,
  getAdminUsers,
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

export type SurfaceState<T> =
  | { kind: "loading"; message: string; items: []; payload: null }
  | { kind: "error"; message: string; items: []; payload: null }
  | { kind: "empty"; message: string; items: []; payload: T }
  | { kind: "data"; message: string; items: SurfaceItems; payload: T };

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

async function loadPublic<T>(request: { method: string; path: string }, options?: { baseUrl?: string; fetchImpl?: FetchLike }): Promise<SurfaceState<T>> {
  const baseUrl = resolveBaseUrl(options?.baseUrl);

  if (!baseUrl) {
    return { kind: "error", message: "API base URL is not configured.", items: [], payload: null };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(buildUrl(baseUrl, request.path), { method: request.method });

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

export function getLoadingState<T>(message: string): SurfaceState<T> {
  return { kind: "loading", message, items: [], payload: null };
}

export function getHomePageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getPublicStatus(), options);
}

export function getJobsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getPublicJobs(), options);
}

export function getScamsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getPublicScams(), options);
}

export function getAnalyticsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getPublicReferences(), options);
}

export function getSavedJobsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getMeSavedJobs(), options);
}

export function getNotificationsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getMeNotifications(), options);
}

export function getBackgroundCheckPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getMeBackgroundCheck(), options);
}

export function getPortfolioReviewPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getMePortfolioReviews(), options);
}

export function getSettingsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getMeSettings(), options);
}

export function getAdminUsersPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getAdminUsers(), options);
}

export function getAdminStatsPageData(options?: { baseUrl?: string; fetchImpl?: FetchLike }) {
  return loadPublic<unknown[]>(getAdminStats(), options);
}
