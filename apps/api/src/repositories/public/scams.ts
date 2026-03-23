export type PublicScamsQuery = {
  readonly limit: number;
  readonly cursor: number;
  readonly severity?: string;
};

export type PublicScam = {
  readonly id: string;
  readonly title: string;
  readonly severity: string;
  readonly reportedAt: string;
};

export type PublicScamsResult = {
  readonly data: PublicScam[];
  readonly total: number;
  readonly nextCursor: number | null;
};

const PUBLIC_SCAMS: readonly PublicScam[] = [
  {
    id: "scam_1",
    title: "Chargeback scam report",
    severity: "high",
    reportedAt: "2026-03-18T12:00:00.000Z",
  },
  {
    id: "scam_2",
    title: "Impersonation warning",
    severity: "high",
    reportedAt: "2026-03-19T13:00:00.000Z",
  },
  {
    id: "scam_3",
    title: "Late payment pattern",
    severity: "medium",
    reportedAt: "2026-03-20T14:00:00.000Z",
  },
];

export function listPublicScams(query: PublicScamsQuery): PublicScamsResult {
  const filtered = query.severity
    ? PUBLIC_SCAMS.filter((scam) => scam.severity === query.severity)
    : PUBLIC_SCAMS;

  const page = filtered.slice(query.cursor, query.cursor + query.limit);
  const nextCursor = query.cursor + query.limit < filtered.length ? query.cursor + query.limit : null;

  return {
    data: [...page],
    total: filtered.length,
    nextCursor,
  };
}
